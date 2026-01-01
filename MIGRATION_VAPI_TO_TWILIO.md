# Database Migration: Vapi to Twilio

## 🚨 IMPORTANT: Run This Migration

Since we've removed all Vapi support and made Twilio the **ONLY** provider, you need to update your existing database.

## What This Migration Does

1. **Drops old constraint** that allowed both 'vapi' and 'twilio'
2. **Updates all existing agents** from `provider_type = 'vapi'` to `provider_type = 'twilio'`
3. **Sets NULL values** to 'twilio' (for any agents without a provider_type)
4. **Adds new constraint** that only allows 'twilio'
5. **Updates default value** to 'twilio' for new rows

## How to Run

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file: `supabase/migrations/009_migrate_vapi_to_twilio.sql`
4. Copy the entire contents
5. Paste into SQL Editor
6. Click **Run** or press `Ctrl+Enter`

### Option 2: Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push
```

### Option 3: Direct SQL Connection

If you have direct database access:

```bash
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/009_migrate_vapi_to_twilio.sql
```

## Verification

After running the migration, verify it worked:

```sql
-- Check all agents have provider_type = 'twilio'
SELECT id, name, provider_type, twilio_phone_number 
FROM agents 
ORDER BY created_at DESC;

-- Count agents by provider_type (should all be 'twilio')
SELECT provider_type, COUNT(*) 
FROM agents 
GROUP BY provider_type;

-- Check for any NULL provider_type (should be 0)
SELECT COUNT(*) 
FROM agents 
WHERE provider_type IS NULL;
```

## Expected Results

- ✅ All agents should have `provider_type = 'twilio'`
- ✅ No agents should have `provider_type = 'vapi'`
- ✅ No agents should have `provider_type IS NULL`
- ✅ New agents will automatically get `provider_type = 'twilio'`

## ⚠️ Important Notes

1. **This migration is safe** - it only updates the `provider_type` column
2. **Vapi data is preserved** - `vapi_assistant_id` and `vapi_phone_number_id` columns remain (but won't be used)
3. **Existing agents will need Twilio numbers** - If your existing agents don't have Twilio numbers, you'll need to:
   - Purchase Twilio numbers for them, OR
   - Delete and recreate them (they'll get Twilio numbers automatically)

## Troubleshooting

### Error: "constraint does not exist"
- This is fine - it means the constraint was already dropped or never existed
- The migration handles this with a DO block

### Error: "column provider_type does not exist"
- Run the previous migration first: `008_add_twilio_support.sql`
- This adds the `provider_type` column

### After migration, agents still show as 'vapi'
- Check if the migration actually ran
- Verify with the SQL queries above
- If still showing 'vapi', manually update:
  ```sql
  UPDATE agents SET provider_type = 'twilio' WHERE provider_type = 'vapi';
  ```

## Next Steps

After running this migration:

1. ✅ All agents are now Twilio-only
2. ✅ New agents will automatically use Twilio
3. ⚠️ **Important**: Existing agents without Twilio phone numbers need to be updated:
   - Either purchase Twilio numbers for them
   - Or delete and recreate them (they'll get numbers automatically)

---

**Migration File**: `supabase/migrations/009_migrate_vapi_to_twilio.sql`  
**Created**: 2025-01-01  
**Purpose**: Migrate all agents from Vapi to Twilio-only system

