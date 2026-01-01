-- Migration: UX Restructure - One Agent Per Client
-- This migration enforces that clients can only have ONE agent
-- Admins can still see/manage all agents

-- ============================================
-- 1. ADD UNIQUE CONSTRAINT: ONE AGENT PER CLIENT
-- ============================================

-- Add unique constraint on (user_id) for agents table
-- This ensures each client (user) can only have ONE agent
-- Note: This doesn't affect admins viewing all agents, only prevents clients from creating multiple

-- First, check if there are any users with multiple agents
-- If so, we'll need to handle them (keep the most recent one)
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  -- Count users with multiple agents
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT user_id, COUNT(*) as agent_count
    FROM agents
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE NOTICE 'Found % users with multiple agents. Keeping the most recent agent for each user.', duplicate_count;
    
    -- Delete older agents, keeping only the most recent one per user
    DELETE FROM agents a1
    WHERE EXISTS (
      SELECT 1
      FROM agents a2
      WHERE a2.user_id = a1.user_id
      AND a2.created_at > a1.created_at
    );
    
    RAISE NOTICE 'Cleaned up duplicate agents. Each user now has only one agent.';
  END IF;
END $$;

-- Now add the unique constraint
-- This will prevent clients from creating multiple agents
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'agents_one_per_user'
  ) THEN
    ALTER TABLE agents
      ADD CONSTRAINT agents_one_per_user 
      UNIQUE (user_id);
    
    RAISE NOTICE 'Added unique constraint: one agent per user';
  ELSE
    RAISE NOTICE 'Constraint agents_one_per_user already exists';
  END IF;
END $$;

-- ============================================
-- 2. VERIFICATION QUERIES
-- ============================================

-- Run these queries to verify:
-- 
-- Check for any users with multiple agents (should be 0):
-- SELECT user_id, COUNT(*) as agent_count
-- FROM agents
-- GROUP BY user_id
-- HAVING COUNT(*) > 1;
--
-- Count total agents:
-- SELECT COUNT(*) FROM agents;
--
-- Count unique users with agents:
-- SELECT COUNT(DISTINCT user_id) FROM agents;

