-- Migration: Add Twilio Support for DIY Voice Assistant
-- This migration adds support for Twilio as an alternative to Vapi.ai
-- Allows users to choose between Vapi (existing) or Twilio (cost-effective DIY option)

-- ============================================
-- 1. UPDATE AGENTS TABLE
-- ============================================

-- Add provider type to agents table (Twilio ONLY)
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS provider_type TEXT DEFAULT 'twilio' 
  CHECK (provider_type IN ('twilio')),
  
  -- Twilio-specific fields
  ADD COLUMN IF NOT EXISTS twilio_phone_number_sid TEXT,
  ADD COLUMN IF NOT EXISTS twilio_phone_number TEXT,
  
  -- Call tracking
  ADD COLUMN IF NOT EXISTS twilio_call_sid TEXT,
  ADD COLUMN IF NOT EXISTS call_state TEXT DEFAULT 'idle' 
  CHECK (call_state IN ('idle', 'ringing', 'in-progress', 'completed', 'failed'));

-- Create indexes for Twilio fields
CREATE INDEX IF NOT EXISTS idx_agents_provider_type ON agents(provider_type);
CREATE INDEX IF NOT EXISTS idx_agents_twilio_phone_number_sid ON agents(twilio_phone_number_sid);
CREATE INDEX IF NOT EXISTS idx_agents_twilio_phone_number ON agents(twilio_phone_number);

-- ============================================
-- 2. CREATE TWILIO CALL SESSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS twilio_call_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  call_sid TEXT NOT NULL UNIQUE, -- Twilio Call SID
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'in-progress', 'completed', 'failed', 'busy', 'no-answer')),
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  duration INTEGER, -- Final call duration in seconds
  recording_url TEXT,
  recording_sid TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. CREATE TWILIO MEDIA STREAM SESSIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS twilio_media_streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_sid TEXT NOT NULL REFERENCES twilio_call_sessions(call_sid) ON DELETE CASCADE,
  stream_sid TEXT NOT NULL UNIQUE, -- Twilio Stream SID
  status TEXT DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected')),
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  disconnected_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- 4. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_twilio_call_sessions_agent_id ON twilio_call_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_twilio_call_sessions_call_sid ON twilio_call_sessions(call_sid);
CREATE INDEX IF NOT EXISTS idx_twilio_call_sessions_status ON twilio_call_sessions(status);
CREATE INDEX IF NOT EXISTS idx_twilio_call_sessions_created_at ON twilio_call_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_twilio_media_streams_call_sid ON twilio_media_streams(call_sid);
CREATE INDEX IF NOT EXISTS idx_twilio_media_streams_stream_sid ON twilio_media_streams(stream_sid);

-- ============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE twilio_call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE twilio_media_streams ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS POLICIES FOR TWILIO CALL SESSIONS
-- ============================================

-- Users can view their own call sessions
CREATE POLICY "Users can view own call sessions"
  ON twilio_call_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = twilio_call_sessions.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- Service role can insert call sessions (from webhooks)
CREATE POLICY "Service role can insert call sessions"
  ON twilio_call_sessions FOR INSERT
  WITH CHECK (true);

-- Users can update their own call sessions
CREATE POLICY "Users can update own call sessions"
  ON twilio_call_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = twilio_call_sessions.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- Service role can update call sessions (from webhooks)
CREATE POLICY "Service role can update call sessions"
  ON twilio_call_sessions FOR UPDATE
  USING (true);

-- ============================================
-- 7. RLS POLICIES FOR TWILIO MEDIA STREAMS
-- ============================================

-- Users can view their own media streams
CREATE POLICY "Users can view own media streams"
  ON twilio_media_streams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM twilio_call_sessions
      JOIN agents ON agents.id = twilio_call_sessions.agent_id
      WHERE twilio_call_sessions.call_sid = twilio_media_streams.call_sid
      AND agents.user_id = auth.uid()
    )
  );

-- Service role can insert media streams (from webhooks)
CREATE POLICY "Service role can insert media streams"
  ON twilio_media_streams FOR INSERT
  WITH CHECK (true);

-- Service role can update media streams (from webhooks)
CREATE POLICY "Service role can update media streams"
  ON twilio_media_streams FOR UPDATE
  USING (true);

-- ============================================
-- 8. ADD TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE TRIGGER update_twilio_call_sessions_updated_at
  BEFORE UPDATE ON twilio_call_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 9. FUNCTION TO LINK CALL SESSION TO LEAD
-- ============================================

-- This function can be called to create a lead from a Twilio call session
CREATE OR REPLACE FUNCTION public.create_lead_from_twilio_call(
  p_call_sid TEXT,
  p_call_summary TEXT DEFAULT NULL,
  p_call_transcript TEXT DEFAULT NULL,
  p_sentiment TEXT DEFAULT NULL,
  p_structured_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_agent_id UUID;
  v_customer_phone TEXT;
  v_duration INTEGER;
  v_recording_url TEXT;
  v_lead_id UUID;
BEGIN
  -- Get call session data
  SELECT 
    agent_id,
    from_number,
    duration,
    recording_url
  INTO v_agent_id, v_customer_phone, v_duration, v_recording_url
  FROM twilio_call_sessions
  WHERE call_sid = p_call_sid;
  
  IF v_agent_id IS NULL THEN
    RAISE EXCEPTION 'Call session not found: %', p_call_sid;
  END IF;
  
  -- Create lead
  INSERT INTO leads (
    agent_id,
    customer_phone,
    call_summary,
    call_transcript,
    recording_url,
    sentiment,
    structured_data,
    duration
  ) VALUES (
    v_agent_id,
    v_customer_phone,
    p_call_summary,
    p_call_transcript,
    v_recording_url,
    p_sentiment,
    p_structured_data,
    v_duration
  )
  RETURNING id INTO v_lead_id;
  
  RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

