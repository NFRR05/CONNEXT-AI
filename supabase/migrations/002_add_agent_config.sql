-- Migration: Add form data and workflow configuration to agents table
-- This allows storing detailed agent configuration for sophisticated workflow generation

-- Add JSONB columns for form data and workflow configuration
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS form_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS workflow_config JSONB DEFAULT '{}'::jsonb;

-- Create index for querying by form data (optional, for analytics)
CREATE INDEX IF NOT EXISTS idx_agents_form_data ON agents USING GIN (form_data);
CREATE INDEX IF NOT EXISTS idx_agents_workflow_config ON agents USING GIN (workflow_config);

-- Add comment for documentation
COMMENT ON COLUMN agents.form_data IS 'Stores the form data collected during agent creation (business type, purpose, etc.)';
COMMENT ON COLUMN agents.workflow_config IS 'Stores workflow configuration (validation, error handling, integrations, etc.)';

