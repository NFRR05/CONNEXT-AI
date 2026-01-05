-- Migration: Remove telephony call session tables
-- Date: 2026-01-03
-- Description: Remove retell_call_sessions and twilio_call_sessions tables as we migrate to n8n-first architecture
--              where n8n handles all call processing and only sends final data to CONNEXT AI

-- ============================================
-- 1. DROP TWILIO MEDIA STREAMS TABLE FIRST (has foreign key to twilio_call_sessions)
-- ============================================

DROP TABLE IF EXISTS twilio_media_streams CASCADE;

-- ============================================
-- 2. DROP CALL SESSION TABLES
-- ============================================

DROP TABLE IF EXISTS retell_call_sessions CASCADE;
DROP TABLE IF EXISTS twilio_call_sessions CASCADE;

-- ============================================
-- 3. DROP RELATED INDEXES (if they still exist)
-- ============================================

DROP INDEX IF EXISTS idx_retell_call_sessions_agent_id;
DROP INDEX IF EXISTS idx_retell_call_sessions_call_id;
DROP INDEX IF EXISTS idx_retell_call_sessions_created_at;
DROP INDEX IF EXISTS idx_twilio_call_sessions_agent_id;
DROP INDEX IF EXISTS idx_twilio_call_sessions_call_sid;
DROP INDEX IF EXISTS idx_twilio_call_sessions_status;
DROP INDEX IF EXISTS idx_twilio_call_sessions_created_at;
DROP INDEX IF EXISTS idx_twilio_media_streams_call_sid;
DROP INDEX IF EXISTS idx_twilio_media_streams_stream_sid;

-- ============================================
-- 4. DROP RELATED TRIGGERS (if they still exist)
-- ============================================

DROP TRIGGER IF EXISTS update_retell_call_sessions_updated_at ON retell_call_sessions;
DROP TRIGGER IF EXISTS update_twilio_call_sessions_updated_at ON twilio_call_sessions;

-- ============================================
-- 5. DROP RELATED RLS POLICIES (if they still exist)
-- ============================================

-- Retell policies
DROP POLICY IF EXISTS "Users can view call sessions for own agents" ON retell_call_sessions;
DROP POLICY IF EXISTS "Service role can insert call sessions" ON retell_call_sessions;
DROP POLICY IF EXISTS "Service role can update call sessions" ON retell_call_sessions;

-- Twilio policies
DROP POLICY IF EXISTS "Users can view own call sessions" ON twilio_call_sessions;
DROP POLICY IF EXISTS "Users can update own call sessions" ON twilio_call_sessions;
DROP POLICY IF EXISTS "Service role can update call sessions" ON twilio_call_sessions;
DROP POLICY IF EXISTS "Service role can insert call sessions" ON twilio_call_sessions;
DROP POLICY IF EXISTS "Consolidated twilio_call_sessions UPDATE" ON twilio_call_sessions;

-- Twilio media streams policies
DROP POLICY IF EXISTS "Users can view media streams for own agents" ON twilio_media_streams;
DROP POLICY IF EXISTS "Service role can insert media streams" ON twilio_media_streams;
DROP POLICY IF EXISTS "Service role can update media streams" ON twilio_media_streams;

-- ============================================
-- Note: The tables, indexes, triggers, and policies are dropped with CASCADE
-- to ensure all dependencies are removed cleanly.
-- ============================================

