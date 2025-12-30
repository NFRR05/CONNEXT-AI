# Supabase Migration Instructions

## Quick Start

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **SQL Editor**

2. **Run the Migration**
   - Copy the entire contents of `supabase/migrations/006_two_portal_system.sql`
   - Paste into SQL Editor
   - Click **Run**

3. **Set Yourself as Admin**
   ```sql
   -- Replace with your email
   UPDATE profiles 
   SET role = 'admin' 
   WHERE email = 'your-email@example.com';
   ```

4. **Verify Migration**
   ```sql
   -- Check roles
   SELECT id, email, role, subscription_tier FROM profiles;
   
   -- Check new columns
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'agent_requests' 
   AND column_name IN ('priority', 'estimated_completion');
   ```

## What the Migration Does

1. **Updates `profiles` table:**
   - Removes 'free' tier (replaces with 'basic')
   - Adds `role` column (client, admin, support)
   - Updates subscription tiers to: basic, pro, enterprise

2. **Updates `agent_requests` table:**
   - Adds `priority` column (low, normal, high, urgent)
   - Adds `estimated_completion` column

3. **Updates RLS Policies:**
   - Clients can only see their own data
   - Admins can see all data
   - Proper isolation between clients

4. **Creates Helper Functions:**
   - `is_admin()` function for role checking

## After Migration

1. **Set Admin Users:**
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';
   ```

2. **Update Client Tiers (if needed):**
   ```sql
   UPDATE profiles SET subscription_tier = 'pro' WHERE email = 'client@example.com';
   ```

3. **Test Access:**
   - Log in as admin → should see `/admin/dashboard`
   - Log in as client → should see `/client/dashboard`

## Rollback (if needed)

```sql
-- Remove role column
ALTER TABLE profiles DROP COLUMN IF EXISTS role;

-- Restore old tier constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_tier_check 
  CHECK (subscription_tier IN ('free', 'pro'));

-- Remove new columns from agent_requests
ALTER TABLE agent_requests DROP COLUMN IF EXISTS priority;
ALTER TABLE agent_requests DROP COLUMN IF EXISTS estimated_completion;
```

## Important Notes

- **All existing users** will be set to `role = 'client'` and `subscription_tier = 'basic'`
- **You must manually set yourself as admin** after migration
- **No data is lost** - this is a safe migration
- **RLS policies** are updated to enforce role-based access

