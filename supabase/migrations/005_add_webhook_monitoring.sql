-- Add n8n workflow tracking to agents table
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS n8n_workflow_id TEXT, -- For hosted n8n workflows
ADD COLUMN IF NOT EXISTS n8n_hosting_type TEXT DEFAULT 'self_hosted' CHECK (n8n_hosting_type IN ('self_hosted', 'hosted'));

-- Webhook activity monitoring table
CREATE TABLE IF NOT EXISTS webhook_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  last_webhook_at TIMESTAMP WITH TIME ZONE,
  webhook_count_24h INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'warning')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id)
);

-- Index for monitoring queries
CREATE INDEX IF NOT EXISTS idx_webhook_activity_agent_id ON webhook_activity(agent_id);
CREATE INDEX IF NOT EXISTS idx_webhook_activity_status ON webhook_activity(status);
CREATE INDEX IF NOT EXISTS idx_webhook_activity_last_webhook ON webhook_activity(last_webhook_at);

-- Function to update webhook activity
CREATE OR REPLACE FUNCTION update_webhook_activity(p_agent_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO webhook_activity (agent_id, last_webhook_at, webhook_count_24h, status, updated_at)
  VALUES (
    p_agent_id,
    NOW(),
    1,
    'active',
    NOW()
  )
  ON CONFLICT (agent_id)
  DO UPDATE SET
    last_webhook_at = NOW(),
    webhook_count_24h = webhook_activity.webhook_count_24h + 1,
    status = 'active',
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check for inactive agents (no webhooks in 24 hours)
CREATE OR REPLACE FUNCTION check_inactive_agents()
RETURNS TABLE (
  agent_id UUID,
  agent_name TEXT,
  user_id UUID,
  last_webhook_at TIMESTAMP WITH TIME ZONE,
  hours_since_last_webhook NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id AS agent_id,
    a.name AS agent_name,
    a.user_id,
    wa.last_webhook_at,
    EXTRACT(EPOCH FROM (NOW() - wa.last_webhook_at)) / 3600 AS hours_since_last_webhook
  FROM agents a
  LEFT JOIN webhook_activity wa ON a.id = wa.agent_id
  WHERE 
    a.n8n_hosting_type = 'self_hosted' -- Only check self-hosted
    AND (
      wa.last_webhook_at IS NULL 
      OR wa.last_webhook_at < NOW() - INTERVAL '24 hours'
    )
    AND a.created_at < NOW() - INTERVAL '1 hour'; -- Give new agents 1 hour grace period
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE webhook_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view webhook activity for own agents"
  ON webhook_activity FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = webhook_activity.agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage webhook activity"
  ON webhook_activity FOR ALL
  USING (true)
  WITH CHECK (true);

