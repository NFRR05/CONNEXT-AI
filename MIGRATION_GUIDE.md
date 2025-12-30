# Migration Guide: Two-Portal System

This guide explains how to migrate your CONNEXT AI instance to the new two-portal system (Client Portal + Admin Portal).

## Overview

The system now supports:
- **Client Portal**: For clients to submit requests, view agents, and manage leads
- **Admin Portal**: For you to manage requests, agents, and n8n workflows
- **Role-based access**: Clients and admins have different permissions
- **Auto-deployment**: n8n workflows are automatically created when you approve requests

## Database Migration

### Step 1: Run the Migration

Apply the migration file to your Supabase database:

```bash
# Option 1: Via Supabase Dashboard
# 1. Go to your Supabase project dashboard
# 2. Navigate to SQL Editor
# 3. Copy and paste the contents of: supabase/migrations/006_two_portal_system.sql
# 4. Run the migration

# Option 2: Via Supabase CLI
supabase db push
```

### Step 2: Verify Migration

After running the migration, verify the changes:

```sql
-- Check that profiles table has role column
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'role';

-- Check that subscription_tier constraint is updated
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'profiles_subscription_tier_check';

-- Check that agent_requests has priority column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'agent_requests' AND column_name = 'priority';
```

### Step 3: Set Admin Users

You need to set yourself (and any support staff) as admin:

```sql
-- Set your user as admin (replace 'your-email@example.com' with your email)
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';

-- Or set by user ID
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'your-user-id-here';

-- Verify admin users
SELECT id, email, role, subscription_tier 
FROM profiles 
WHERE role IN ('admin', 'support');
```

### Step 4: Update Existing Users

All existing users will be set to:
- `role = 'client'` (default)
- `subscription_tier = 'basic'` (if they were 'free')

You can manually update tiers if needed:

```sql
-- Update specific users to pro tier
UPDATE profiles 
SET subscription_tier = 'pro' 
WHERE email IN ('client1@example.com', 'client2@example.com');

-- Update to enterprise tier
UPDATE profiles 
SET subscription_tier = 'enterprise' 
WHERE email = 'enterprise-client@example.com';
```

## Environment Variables

Ensure you have these environment variables set:

```env
# n8n Configuration (REQUIRED for auto-deployment)
N8N_API_URL=http://localhost:5678  # Your n8n instance URL
N8N_API_KEY=your-n8n-api-key        # Your n8n API key

# App URL (for webhook URLs)
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Vapi Configuration
VAPI_API_KEY=your-vapi-api-key

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
```

## n8n Setup

### Step 1: Get Your n8n API Key

1. Log into your n8n instance
2. Go to Settings → API
3. Create a new API key
4. Copy the API key to your `.env` file

### Step 2: Verify n8n Connection

Test that your app can connect to n8n:

```typescript
// You can test this in a Next.js API route or script
import { createHostedWorkflow } from '@/lib/n8n/hosted'

// Test connection
const testWorkflow = {
  name: 'Test Workflow',
  nodes: [],
  connections: {},
  active: false
}

try {
  const result = await createHostedWorkflow(testWorkflow, 'test-secret')
  console.log('n8n connection successful:', result)
} catch (error) {
  console.error('n8n connection failed:', error)
}
```

## What Changed

### 1. User Roles

- **Client**: Can submit requests, view their agents and leads
- **Admin**: Can approve/reject requests, manage all agents, manage n8n workflows
- **Support**: Same permissions as admin (for support staff)

### 2. Portal Structure

**Client Portal** (`/client/*`):
- `/client/dashboard` - Overview
- `/client/requests` - View and create requests
- `/client/agents` - View active agents (read-only)
- `/client/leads` - View leads from their agents

**Admin Portal** (`/admin/*`):
- `/admin/dashboard` - System overview
- `/admin/requests` - Review and approve/reject requests
- `/admin/agents` - Manage all agents
- `/admin/workflows` - Manage n8n workflows

### 3. Auto-Deployment

When you approve an agent creation request:
1. Agent is created in database
2. Vapi assistant is created
3. **n8n workflow is automatically created and activated** in your hosted n8n instance
4. Client is notified

### 4. Request System

Clients can now:
- Submit requests to create/update/delete agents
- Set request priority (low, normal, high, urgent)
- View request status and admin notes
- Cancel pending requests

Admins can:
- Review all requests
- Approve/reject with notes
- See request priority
- Auto-deploy workflows on approval

## Testing the Migration

### 1. Test Client Portal

1. Log in as a client user
2. Navigate to `/client/dashboard`
3. Create a new request
4. Verify you can see your requests, agents, and leads

### 2. Test Admin Portal

1. Log in as an admin user
2. Navigate to `/admin/dashboard`
3. Go to `/admin/requests`
4. Approve a test request
5. Verify n8n workflow is created

### 3. Test Auto-Deployment

1. As admin, approve a client's agent creation request
2. Check your n8n instance - workflow should be created automatically
3. Verify workflow is active
4. Check agent record has `n8n_workflow_id` populated

## Troubleshooting

### Issue: "Unauthorized" when accessing admin portal

**Solution**: Make sure your user has `role = 'admin'` in the profiles table:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

### Issue: n8n workflow not being created

**Check**:
1. `N8N_API_URL` is correct
2. `N8N_API_KEY` is valid
3. n8n instance is accessible from your app
4. Check server logs for errors

### Issue: Clients can't see their agents

**Check**:
1. RLS policies are applied correctly
2. Agents have correct `user_id`
3. Client is logged in with correct user

### Issue: Migration fails

**Solution**:
1. Check Supabase logs
2. Verify you have permissions to alter tables
3. Make sure no existing constraints conflict
4. Run migration in smaller chunks if needed

## Rollback Plan

If you need to rollback:

```sql
-- Remove role column (will set all to NULL, then default to 'client')
ALTER TABLE profiles DROP COLUMN IF EXISTS role;

-- Restore old subscription tier constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_tier_check 
  CHECK (subscription_tier IN ('free', 'pro'));

-- Remove priority from agent_requests
ALTER TABLE agent_requests DROP COLUMN IF EXISTS priority;
ALTER TABLE agent_requests DROP COLUMN IF EXISTS estimated_completion;
```

## Next Steps

After migration:

1. **Set up admin users** (see Step 3 above)
2. **Test the portals** (client and admin)
3. **Verify n8n auto-deployment** works
4. **Update any custom integrations** that might reference old routes
5. **Notify clients** about the new portal structure

## Support

If you encounter issues:
1. Check server logs
2. Verify database migration completed
3. Check environment variables
4. Test n8n connection separately

---

**Migration Date**: [Date you ran the migration]  
**Version**: 2.0.0  
**Status**: ✅ Complete

