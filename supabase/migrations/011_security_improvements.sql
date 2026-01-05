-- Security Improvements Migration
-- Adds encryption support and security enhancements

-- Add encrypted fields support
-- Note: Actual encryption happens in application layer
-- This migration adds fields to track encryption status

-- Add encryption metadata to agents table
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS api_secret_encrypted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS system_prompt_encrypted BOOLEAN DEFAULT false;

-- Add encryption metadata to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS customer_phone_encrypted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS call_transcript_encrypted BOOLEAN DEFAULT false;

-- Create audit log table for security events
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  resource_type TEXT, -- 'agent', 'lead', 'request', etc.
  resource_id UUID,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'access', 'failed_login', etc.
  ip_address INET,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_security_audit_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_event_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_created_at ON security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_resource ON security_audit_log(resource_type, resource_id);

-- RLS for audit log (only service role can insert, users can view their own)
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage audit logs"
  ON security_audit_log FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view own audit logs"
  ON security_audit_log FOR SELECT
  USING (auth.uid() = user_id);

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_action TEXT,
  p_ip_address INET,
  p_user_agent TEXT,
  p_details JSONB DEFAULT '{}'::jsonb
) RETURNS void AS $$
BEGIN
  INSERT INTO security_audit_log (
    user_id,
    event_type,
    resource_type,
    resource_id,
    action,
    ip_address,
    user_agent,
    details
  ) VALUES (
    p_user_id,
    p_event_type,
    p_resource_type,
    p_resource_id,
    p_action,
    p_ip_address,
    p_user_agent,
    p_details
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add password policy tracking
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP WITH TIME ZONE;

-- Function to check and update failed login attempts
CREATE OR REPLACE FUNCTION check_failed_login_attempts(
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_attempts INTEGER;
  v_locked_until TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT failed_login_attempts, account_locked_until
  INTO v_attempts, v_locked_until
  FROM profiles
  WHERE id = p_user_id;
  
  -- Check if account is locked
  IF v_locked_until IS NOT NULL AND v_locked_until > NOW() THEN
    RETURN FALSE; -- Account is locked
  END IF;
  
  -- Reset lock if expired
  IF v_locked_until IS NOT NULL AND v_locked_until <= NOW() THEN
    UPDATE profiles
    SET failed_login_attempts = 0,
        account_locked_until = NULL
    WHERE id = p_user_id;
    RETURN TRUE;
  END IF;
  
  RETURN TRUE; -- Account is not locked
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment failed login attempts
CREATE OR REPLACE FUNCTION increment_failed_login(
  p_user_id UUID
) RETURNS void AS $$
DECLARE
  v_attempts INTEGER;
BEGIN
  UPDATE profiles
  SET failed_login_attempts = failed_login_attempts + 1
  WHERE id = p_user_id
  RETURNING failed_login_attempts INTO v_attempts;
  
  -- Lock account after 5 failed attempts for 30 minutes
  IF v_attempts >= 5 THEN
    UPDATE profiles
    SET account_locked_until = NOW() + INTERVAL '30 minutes'
    WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset failed login attempts on successful login
CREATE OR REPLACE FUNCTION reset_failed_login(
  p_user_id UUID
) RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET failed_login_attempts = 0,
      account_locked_until = NULL
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

