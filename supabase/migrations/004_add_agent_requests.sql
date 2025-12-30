-- Agent Requests table for ticket-based system
CREATE TABLE IF NOT EXISTS agent_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL, -- NULL for new agents
  request_type TEXT NOT NULL CHECK (request_type IN ('create', 'update', 'delete')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
  
  -- Request data
  name TEXT,
  description TEXT,
  system_prompt TEXT,
  voice_id TEXT,
  form_data JSONB DEFAULT '{}'::jsonb,
  workflow_config JSONB DEFAULT '{}'::jsonb,
  
  -- Admin notes
  admin_notes TEXT,
  admin_id UUID REFERENCES profiles(id), -- Who processed it
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_agent_requests_user_id ON agent_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_requests_status ON agent_requests(status);
CREATE INDEX IF NOT EXISTS idx_agent_requests_agent_id ON agent_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_requests_created_at ON agent_requests(created_at DESC);

-- RLS Policies
ALTER TABLE agent_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own requests"
  ON agent_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create own requests"
  ON agent_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending requests (to cancel or modify before approval)
CREATE POLICY "Users can update own pending requests"
  ON agent_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Service role can manage all requests (for admin operations)
CREATE POLICY "Service role can manage all requests"
  ON agent_requests FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_agent_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER update_agent_requests_timestamp
  BEFORE UPDATE ON agent_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_requests_updated_at();

