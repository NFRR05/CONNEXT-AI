-- Migration: Fix Function Search Path Security Issues
-- This migration fixes all SECURITY DEFINER functions to prevent search path hijacking
-- by setting search_path = '' and using fully qualified table names
--
-- Security Issue: Functions without fixed search_path can be vulnerable to SQL injection
-- via search path manipulation attacks
--
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- ============================================
-- 1. Fix log_security_event
-- ============================================
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_action TEXT,
  p_ip_address INET,
  p_user_agent TEXT,
  p_details JSONB DEFAULT '{}'::jsonb
) RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
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
$$;

-- ============================================
-- 2. Fix check_failed_login_attempts
-- ============================================
CREATE OR REPLACE FUNCTION check_failed_login_attempts(
  p_user_id UUID
) RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_attempts INTEGER;
  v_locked_until TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT failed_login_attempts, account_locked_until
  INTO v_attempts, v_locked_until
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Check if account is locked
  IF v_locked_until IS NOT NULL AND v_locked_until > NOW() THEN
    RETURN FALSE; -- Account is locked
  END IF;
  
  -- Reset lock if expired
  IF v_locked_until IS NOT NULL AND v_locked_until <= NOW() THEN
    UPDATE public.profiles
    SET failed_login_attempts = 0,
        account_locked_until = NULL
    WHERE id = p_user_id;
    RETURN TRUE;
  END IF;
  
  RETURN TRUE; -- Account is not locked
END;
$$;

-- ============================================
-- 3. Fix increment_failed_login
-- ============================================
CREATE OR REPLACE FUNCTION increment_failed_login(
  p_user_id UUID
) RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_attempts INTEGER;
BEGIN
  UPDATE public.profiles
  SET failed_login_attempts = failed_login_attempts + 1
  WHERE id = p_user_id
  RETURNING failed_login_attempts INTO v_attempts;
  
  -- Lock account after 5 failed attempts for 30 minutes
  IF v_attempts >= 5 THEN
    UPDATE public.profiles
    SET account_locked_until = NOW() + INTERVAL '30 minutes'
    WHERE id = p_user_id;
  END IF;
END;
$$;

-- ============================================
-- 4. Fix reset_failed_login
-- ============================================
CREATE OR REPLACE FUNCTION reset_failed_login(
  p_user_id UUID
) RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles
  SET failed_login_attempts = 0,
      account_locked_until = NULL
  WHERE id = p_user_id;
END;
$$;

-- ============================================
-- 5. Fix check_rate_limit
-- ============================================
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER,
  p_window_minutes INTEGER
) RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_reset_at TIMESTAMP WITH TIME ZONE;
  v_allowed BOOLEAN;
BEGIN
  -- Calculate current window start (rounded to nearest minute)
  v_window_start := date_trunc('minute', NOW());
  
  -- Get or create rate limit record
  INSERT INTO public.rate_limits (identifier, endpoint, count, window_start, updated_at)
  VALUES (p_identifier, p_endpoint, 1, v_window_start, NOW())
  ON CONFLICT (identifier, endpoint, window_start)
  DO UPDATE SET 
    count = public.rate_limits.count + 1,
    updated_at = NOW()
  RETURNING count, window_start INTO v_count, v_window_start;
  
  -- Calculate reset time
  v_reset_at := v_window_start + (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Check if limit exceeded
  v_allowed := v_count <= p_max_requests;
  
  -- Clean up old records (older than 2 hours) - run periodically
  DELETE FROM public.rate_limits 
  WHERE window_start < NOW() - INTERVAL '2 hours';
  
  -- Return result
  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'count', v_count,
    'limit', p_max_requests,
    'remaining', GREATEST(0, p_max_requests - v_count),
    'reset_at', v_reset_at
  );
END;
$$;

-- ============================================
-- 6. Fix create_lead_from_twilio_call
-- ============================================
CREATE OR REPLACE FUNCTION create_lead_from_twilio_call(
  p_call_sid TEXT,
  p_call_summary TEXT DEFAULT NULL,
  p_call_transcript TEXT DEFAULT NULL,
  p_sentiment TEXT DEFAULT NULL,
  p_structured_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
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
  FROM public.twilio_call_sessions
  WHERE call_sid = p_call_sid;
  
  IF v_agent_id IS NULL THEN
    RAISE EXCEPTION 'Call session not found: %', p_call_sid;
  END IF;
  
  -- Create lead
  INSERT INTO public.leads (
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
$$;

-- ============================================
-- 7. Fix update_agent_requests_updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_agent_requests_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================
-- 8. Fix update_webhook_activity
-- ============================================
CREATE OR REPLACE FUNCTION update_webhook_activity(p_agent_id UUID)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.webhook_activity (agent_id, last_webhook_at, webhook_count_24h, status, updated_at)
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
    webhook_count_24h = public.webhook_activity.webhook_count_24h + 1,
    status = 'active',
    updated_at = NOW();
END;
$$;

-- ============================================
-- 9. Fix check_inactive_agents
-- ============================================
CREATE OR REPLACE FUNCTION check_inactive_agents()
RETURNS TABLE (
  agent_id UUID,
  agent_name TEXT,
  user_id UUID,
  last_webhook_at TIMESTAMP WITH TIME ZONE,
  hours_since_last_webhook NUMERIC
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id AS agent_id,
    a.name AS agent_name,
    a.user_id,
    wa.last_webhook_at,
    EXTRACT(EPOCH FROM (NOW() - wa.last_webhook_at)) / 3600 AS hours_since_last_webhook
  FROM public.agents a
  LEFT JOIN public.webhook_activity wa ON a.id = wa.agent_id
  WHERE 
    a.n8n_hosting_type = 'self_hosted' -- Only check self-hosted
    AND (
      wa.last_webhook_at IS NULL 
      OR wa.last_webhook_at < NOW() - INTERVAL '24 hours'
    )
    AND a.created_at < NOW() - INTERVAL '1 hour'; -- Give new agents 1 hour grace period
END;
$$;

-- ============================================
-- 10. Fix is_admin
-- ============================================
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id
    AND role IN ('admin', 'support')
  );
END;
$$;

-- ============================================
-- 11. Fix handle_new_user
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- ============================================
-- 12. Fix handle_updated_at
-- ============================================
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$;

-- ============================================
-- Migration Complete
-- ============================================
-- All functions now have SET search_path = '' to prevent search path hijacking
-- All table references use fully qualified names (public.table_name)
-- This fixes the "Function Search Path Mutable" security warnings

