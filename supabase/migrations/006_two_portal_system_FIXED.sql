-- Migration: Two-Portal System (Client + Admin) - FIXED VERSION
-- This migration updates the system to support role-based access with client and admin portals

-- ============================================
-- 1. UPDATE PROFILES TABLE
-- ============================================

-- CRITICAL: Drop the constraint FIRST before any data updates
-- Find and drop ALL check constraints related to subscription_tier
DO $$
DECLARE
  constraint_rec RECORD;
BEGIN
  -- Find all check constraints that involve subscription_tier
  FOR constraint_rec IN 
    SELECT 
      conname,
      pg_get_constraintdef(oid) as constraint_def
    FROM pg_constraint
    WHERE conrelid = 'profiles'::regclass
      AND contype = 'c'
  LOOP
    -- Check if this constraint involves subscription_tier
    IF constraint_rec.constraint_def LIKE '%subscription_tier%' 
       OR constraint_rec.constraint_def LIKE '%free%'
       OR constraint_rec.constraint_def LIKE '%pro%' THEN
      BEGIN
        EXECUTE format('ALTER TABLE profiles DROP CONSTRAINT IF EXISTS %I', constraint_rec.conname);
        RAISE NOTICE 'Dropped constraint: %', constraint_rec.conname;
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop constraint %: %', constraint_rec.conname, SQLERRM;
      END;
    END IF;
  END LOOP;
END $$;

-- NOW update existing data (constraint should be dropped)
UPDATE profiles
SET subscription_tier = 'basic'
WHERE subscription_tier = 'free' OR subscription_tier IS NULL;

-- Also ensure any invalid values are set to 'basic'
UPDATE profiles
SET subscription_tier = 'basic'
WHERE subscription_tier IS NOT NULL
  AND subscription_tier NOT IN ('basic', 'pro', 'enterprise');

-- Add role column first (without constraint)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT;

-- Set default role for existing users
UPDATE profiles
SET role = 'client'
WHERE role IS NULL;

-- Now set the default and add constraint for role
ALTER TABLE profiles
  ALTER COLUMN role SET DEFAULT 'client';

-- Add constraint for role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_role_check 
      CHECK (role IN ('client', 'admin', 'support'));
  END IF;
END $$;

-- Add new subscription tier constraint
ALTER TABLE profiles
  ADD CONSTRAINT profiles_subscription_tier_check 
  CHECK (subscription_tier IN ('basic', 'pro', 'enterprise'));

-- Update default for subscription_tier
ALTER TABLE profiles 
  ALTER COLUMN subscription_tier SET DEFAULT 'basic';

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(subscription_tier);

-- ============================================
-- 2. UPDATE AGENT_REQUESTS TABLE
-- ============================================

-- Add priority and estimated completion
ALTER TABLE agent_requests
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' 
  CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  ADD COLUMN IF NOT EXISTS estimated_completion TIMESTAMP WITH TIME ZONE;

-- Create index for priority-based queries
CREATE INDEX IF NOT EXISTS idx_agent_requests_priority ON agent_requests(priority);
CREATE INDEX IF NOT EXISTS idx_agent_requests_status_priority ON agent_requests(status, priority);

-- ============================================
-- 3. UPDATE RLS POLICIES FOR ROLE-BASED ACCESS
-- ============================================

-- Drop existing policies that need updating
DROP POLICY IF EXISTS "Users can view own agents" ON agents;
DROP POLICY IF EXISTS "Users can view leads for own agents" ON leads;

-- Agents: Clients see own agents, Admins see all
CREATE POLICY "Clients see own agents"
  ON agents FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'support')
    )
  );

-- Leads: Clients see own leads, Admins see all
CREATE POLICY "Clients see own leads"
  ON leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = leads.agent_id
      AND agents.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'support')
    )
  );

-- Agent Requests: Clients see own requests, Admins see all
DROP POLICY IF EXISTS "Users can view own requests" ON agent_requests;
DROP POLICY IF EXISTS "Users can create own requests" ON agent_requests;
DROP POLICY IF EXISTS "Users can update own pending requests" ON agent_requests;

CREATE POLICY "Clients see own requests, admins see all"
  ON agent_requests FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'support')
    )
  );

CREATE POLICY "Clients create own requests"
  ON agent_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Clients update own pending requests"
  ON agent_requests FOR UPDATE
  USING (
    auth.uid() = user_id 
    AND status = 'pending'
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND status = 'pending'
  );

-- Admins can update any request
CREATE POLICY "Admins can manage all requests"
  ON agent_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'support')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'support')
    )
  );

-- ============================================
-- 4. HELPER FUNCTION: Check if user is admin
-- ============================================

CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_user_id
    AND role IN ('admin', 'support')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. FINAL DATA UPDATES (safety checks)
-- ============================================

-- Ensure all profiles have valid tier (safety check)
UPDATE profiles
SET subscription_tier = 'basic'
WHERE subscription_tier NOT IN ('basic', 'pro', 'enterprise') OR subscription_tier IS NULL;

-- Ensure all profiles have valid role (safety check)
UPDATE profiles
SET role = 'client'
WHERE role NOT IN ('client', 'admin', 'support') OR role IS NULL;

-- ============================================
-- 6. COMMENTS
-- ============================================

COMMENT ON COLUMN profiles.role IS 'User role: client (default), admin, or support';
COMMENT ON COLUMN profiles.subscription_tier IS 'Subscription tier: basic, pro, or enterprise (no free tier)';
COMMENT ON COLUMN agent_requests.priority IS 'Request priority: low, normal, high, or urgent';
COMMENT ON COLUMN agent_requests.estimated_completion IS 'Estimated completion time for the request';

