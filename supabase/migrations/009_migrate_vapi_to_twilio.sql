-- Migration: Migrate all existing agents from Vapi to Twilio
-- This migration updates all existing agents to use Twilio as the only provider

-- ============================================
-- 1. DROP OLD CONSTRAINT (if exists)
-- ============================================

-- First, drop the old constraint that allowed both 'vapi' and 'twilio'
DO $$ 
BEGIN
  -- Check if constraint exists and drop it
  IF EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'agents_provider_type_check'
  ) THEN
    ALTER TABLE agents DROP CONSTRAINT agents_provider_type_check;
  END IF;
END $$;

-- ============================================
-- 2. UPDATE ALL EXISTING AGENTS
-- ============================================

-- Update all agents with provider_type = 'vapi' to 'twilio'
UPDATE agents
SET 
  provider_type = 'twilio',
  updated_at = NOW()
WHERE provider_type = 'vapi' OR provider_type IS NULL;

-- Set default for any NULL provider_type values
UPDATE agents
SET 
  provider_type = 'twilio',
  updated_at = NOW()
WHERE provider_type IS NULL;

-- ============================================
-- 3. ADD NEW CONSTRAINT (Twilio ONLY)
-- ============================================

-- Add constraint that only allows 'twilio'
ALTER TABLE agents
  ADD CONSTRAINT agents_provider_type_check 
  CHECK (provider_type = 'twilio');

-- ============================================
-- 4. UPDATE DEFAULT VALUE
-- ============================================

-- Update the default value for new rows
ALTER TABLE agents
  ALTER COLUMN provider_type SET DEFAULT 'twilio';

-- ============================================
-- 5. VERIFICATION QUERIES (for manual check)
-- ============================================

-- Run these queries to verify the migration:
-- 
-- Check all agents have provider_type = 'twilio':
-- SELECT id, name, provider_type, twilio_phone_number 
-- FROM agents 
-- ORDER BY created_at DESC;
--
-- Count agents by provider_type (should all be 'twilio'):
-- SELECT provider_type, COUNT(*) 
-- FROM agents 
-- GROUP BY provider_type;
--
-- Check for any NULL provider_type (should be 0):
-- SELECT COUNT(*) 
-- FROM agents 
-- WHERE provider_type IS NULL;

