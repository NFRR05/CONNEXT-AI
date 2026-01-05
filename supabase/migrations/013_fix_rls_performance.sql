-- Migration: Fix RLS Performance Issues
-- This migration fixes two performance issues:
-- 1. Auth RLS Initialization Plan: Wraps auth.uid() in subqueries for better performance
-- 2. Multiple Permissive Policies: Consolidates overlapping policies into single policies
--
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- ============================================
-- 1. FIX PROFILES TABLE POLICIES
-- ============================================

-- Drop and recreate with optimized auth.uid() calls
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING ((select auth.uid()) = id);

-- ============================================
-- 2. FIX AGENTS TABLE POLICIES
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own agents" ON agents;
DROP POLICY IF EXISTS "Users can create own agents" ON agents;
DROP POLICY IF EXISTS "Users can update own agents" ON agents;
DROP POLICY IF EXISTS "Users can delete own agents" ON agents;
DROP POLICY IF EXISTS "Clients see own agents" ON agents;

-- Create optimized consolidated policies
CREATE POLICY "Clients see own agents, admins see all"
  ON agents FOR SELECT
  USING (
    (select auth.uid()) = user_id 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE public.profiles.id = (select auth.uid())
      AND public.profiles.role IN ('admin', 'support')
    )
  );

CREATE POLICY "Users can create own agents"
  ON agents FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own agents"
  ON agents FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own agents"
  ON agents FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ============================================
-- 3. FIX LEADS TABLE POLICIES
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view leads for own agents" ON leads;
DROP POLICY IF EXISTS "Users can update leads for own agents" ON leads;
DROP POLICY IF EXISTS "Clients see own leads" ON leads;

-- Create optimized consolidated policies
CREATE POLICY "Clients see own leads, admins see all"
  ON leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agents
      WHERE public.agents.id = public.leads.agent_id
      AND public.agents.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE public.profiles.id = (select auth.uid())
      AND public.profiles.role IN ('admin', 'support')
    )
  );

-- Service role can insert leads (unchanged, no auth.uid() call)
-- DROP POLICY IF EXISTS "Service role can insert leads" ON leads;
-- CREATE POLICY "Service role can insert leads"
--   ON leads FOR INSERT
--   WITH CHECK (true);

CREATE POLICY "Users can update leads for own agents"
  ON leads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.agents
      WHERE public.agents.id = public.leads.agent_id
      AND public.agents.user_id = (select auth.uid())
    )
  );

-- ============================================
-- 4. FIX AGENT_REQUESTS TABLE POLICIES
-- Consolidate multiple permissive policies
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own requests" ON agent_requests;
DROP POLICY IF EXISTS "Users can create own requests" ON agent_requests;
DROP POLICY IF EXISTS "Users can update own pending requests" ON agent_requests;
DROP POLICY IF EXISTS "Clients see own requests, admins see all" ON agent_requests;
DROP POLICY IF EXISTS "Clients create own requests" ON agent_requests;
DROP POLICY IF EXISTS "Clients update own pending requests" ON agent_requests;
DROP POLICY IF EXISTS "Admins can manage all requests" ON agent_requests;
DROP POLICY IF EXISTS "Service role can manage all requests" ON agent_requests;

-- Create consolidated policies that combine all conditions
-- SELECT: Users see own OR admins see all OR service role sees all
CREATE POLICY "Consolidated agent_requests SELECT"
  ON agent_requests FOR SELECT
  USING (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE public.profiles.id = (select auth.uid())
      AND public.profiles.role IN ('admin', 'support')
    )
    OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- INSERT: Users create own OR admins can create OR service role can create
CREATE POLICY "Consolidated agent_requests INSERT"
  ON agent_requests FOR INSERT
  WITH CHECK (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE public.profiles.id = (select auth.uid())
      AND public.profiles.role IN ('admin', 'support')
    )
    OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- UPDATE: Users update own pending OR admins update any OR service role update any
CREATE POLICY "Consolidated agent_requests UPDATE"
  ON agent_requests FOR UPDATE
  USING (
    ((select auth.uid()) = user_id AND status = 'pending')
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE public.profiles.id = (select auth.uid())
      AND public.profiles.role IN ('admin', 'support')
    )
    OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  )
  WITH CHECK (
    ((select auth.uid()) = user_id AND status = 'pending')
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE public.profiles.id = (select auth.uid())
      AND public.profiles.role IN ('admin', 'support')
    )
    OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- DELETE: Admins can delete OR service role can delete
CREATE POLICY "Consolidated agent_requests DELETE"
  ON agent_requests FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE public.profiles.id = (select auth.uid())
      AND public.profiles.role IN ('admin', 'support')
    )
    OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- ============================================
-- 5. FIX WEBHOOK_ACTIVITY TABLE POLICIES
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view webhook activity for own agents" ON webhook_activity;
DROP POLICY IF EXISTS "Service role can manage webhook activity" ON webhook_activity;

-- Create consolidated policy
CREATE POLICY "Consolidated webhook_activity SELECT"
  ON webhook_activity FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agents
      WHERE public.agents.id = public.webhook_activity.agent_id
      AND public.agents.user_id = (select auth.uid())
    )
    OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- Service role can manage (INSERT/UPDATE/DELETE)
CREATE POLICY "Service role can manage webhook activity"
  ON webhook_activity FOR ALL
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- ============================================
-- 6. FIX TWILIO_CALL_SESSIONS TABLE POLICIES
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own call sessions" ON twilio_call_sessions;
DROP POLICY IF EXISTS "Users can update own call sessions" ON twilio_call_sessions;
DROP POLICY IF EXISTS "Service role can update call sessions" ON twilio_call_sessions;

-- Create optimized policies
CREATE POLICY "Users can view own call sessions"
  ON twilio_call_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agents
      WHERE public.agents.id = public.twilio_call_sessions.agent_id
      AND public.agents.user_id = (select auth.uid())
    )
  );

-- Consolidated UPDATE policy
CREATE POLICY "Consolidated twilio_call_sessions UPDATE"
  ON twilio_call_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.agents
      WHERE public.agents.id = public.twilio_call_sessions.agent_id
      AND public.agents.user_id = (select auth.uid())
    )
    OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agents
      WHERE public.agents.id = public.twilio_call_sessions.agent_id
      AND public.agents.user_id = (select auth.uid())
    )
    OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- Service role can insert (unchanged)
-- DROP POLICY IF EXISTS "Service role can insert call sessions" ON twilio_call_sessions;
-- CREATE POLICY "Service role can insert call sessions"
--   ON twilio_call_sessions FOR INSERT
--   WITH CHECK (true);

-- ============================================
-- 7. FIX TWILIO_MEDIA_STREAMS TABLE POLICIES
-- ============================================

-- Drop old policy
DROP POLICY IF EXISTS "Users can view own media streams" ON twilio_media_streams;

-- Create optimized policy
CREATE POLICY "Users can view own media streams"
  ON twilio_media_streams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.twilio_call_sessions
      JOIN public.agents ON public.agents.id = public.twilio_call_sessions.agent_id
      WHERE public.twilio_call_sessions.call_sid = public.twilio_media_streams.call_sid
      AND public.agents.user_id = (select auth.uid())
    )
  );

-- Service role policies remain unchanged (no auth.uid() calls)

-- ============================================
-- 8. FIX SECURITY_AUDIT_LOG TABLE POLICIES
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view own audit logs" ON security_audit_log;
DROP POLICY IF EXISTS "Service role can manage audit logs" ON security_audit_log;

-- Create consolidated policy
CREATE POLICY "Consolidated security_audit_log SELECT"
  ON security_audit_log FOR SELECT
  USING (
    (select auth.uid()) = user_id
    OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- Service role can manage (INSERT/UPDATE/DELETE)
CREATE POLICY "Service role can manage audit logs"
  ON security_audit_log FOR ALL
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- ============================================
-- Migration Complete
-- ============================================
-- All RLS policies now use (select auth.uid()) for better performance
-- Multiple permissive policies have been consolidated into single policies
-- This fixes both "Auth RLS Initialization Plan" and "Multiple Permissive Policies" warnings

