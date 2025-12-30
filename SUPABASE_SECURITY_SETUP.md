# Supabase Security Setup Guide

## ✅ Code Changes Applied

All security improvements have been applied to your codebase:
- ✅ Rate limiting utility created (`lib/rate-limit-supabase.ts`)
- ✅ Input validation schemas created (`lib/validation.ts`)
- ✅ Webhook route updated with rate limiting + validation
- ✅ Agents route updated with rate limiting + validation
- ✅ Leads route updated with rate limiting + validation
- ✅ Migration file created (`supabase/migrations/003_add_rate_limiting.sql`)

## 🔧 What You Need to Do in Supabase

### Step 1: Run the Migration

1. **Open Supabase Dashboard**
   - Go to [https://app.supabase.com](https://app.supabase.com)
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Migration**
   - Open the file: `supabase/migrations/003_add_rate_limiting.sql`
   - Copy the **entire contents** of the file
   - Paste it into the SQL Editor
   - Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`)

4. **Verify Success**
   - You should see: "Success. No rows returned"
   - If you see errors, check the error message and let me know

### Step 2: Verify the Table Was Created

1. **Go to Table Editor**
   - Click "Table Editor" in the left sidebar
   - Look for a new table called `rate_limits`
   - It should have these columns:
     - `id` (UUID, primary key)
     - `identifier` (text)
     - `endpoint` (text)
     - `count` (integer)
     - `window_start` (timestamp)
     - `created_at` (timestamp)
     - `updated_at` (timestamp)

### Step 3: Verify the Function Was Created

1. **Go to Database → Functions**
   - Click "Database" in the left sidebar
   - Click "Functions"
   - You should see a function called `check_rate_limit`
   - Click on it to view details

### Step 4: Verify RLS Policy

1. **Go to Authentication → Policies**
   - Click "Authentication" in the left sidebar
   - Click "Policies"
   - Find the `rate_limits` table
   - You should see: **"Service role can manage rate limits"**

### Step 5: Test the Function (Optional)

Run this test query in SQL Editor to verify everything works:

```sql
-- Test the rate limit function
SELECT check_rate_limit(
  'test-user-123',
  'test_endpoint',
  10,
  1
);
```

**Expected Result:**
```json
{
  "allowed": true,
  "count": 1,
  "limit": 10,
  "remaining": 9,
  "reset_at": "2024-01-01T12:01:00+00:00"
}
```

Run it multiple times to see the count increase:
```sql
SELECT check_rate_limit('test-user-123', 'test_endpoint', 10, 1);
SELECT check_rate_limit('test-user-123', 'test_endpoint', 10, 1);
SELECT check_rate_limit('test-user-123', 'test_endpoint', 10, 1);
```

After 3 calls, `count` should be 3 and `remaining` should be 7.

## 📋 Summary of Security Improvements

### 1. Rate Limiting ✅
- **Agent Creation**: 3 requests per hour per user
- **Webhook Ingest**: 100 requests per minute per agent
- **General API**: 30 requests per minute per user
- **Authentication**: 5 requests per 15 minutes per IP (ready for future use)

### 2. Input Validation ✅
- **Webhook Input**: Phone format, URL validation, string length limits, data type validation
- **Agent Creation**: Description length (10-5000 chars), name length (1-100 chars)
- **Lead Updates**: UUID validation, status enum validation

### 3. API Keys Security ✅
- All API keys remain server-side only
- No changes needed - already secure!

## 🚀 After Setup

Once you've run the migration in Supabase:

1. **Test Your API Routes**
   - Try creating an agent (should work normally)
   - Try creating more than 3 agents in an hour (should get rate limit error)
   - Try sending invalid data to webhook (should get validation error)

2. **Monitor Rate Limits**
   - Check the `rate_limits` table in Supabase to see rate limit tracking
   - Old records are automatically cleaned up after 2 hours

3. **Adjust Limits (if needed)**
   - Edit `lib/rate-limit-supabase.ts` to change rate limits
   - Current limits:
     - Agent creation: 3/hour
     - Webhook: 100/minute
     - General API: 30/minute

## ⚠️ Troubleshooting

### Migration Fails
- **Error: "relation already exists"** → The table already exists, you can skip this step
- **Error: "function already exists"** → The function already exists, you can skip this step
- **Error: "permission denied"** → Make sure you're using the service role key in your environment

### Rate Limiting Not Working
- Check that the migration ran successfully
- Verify the `check_rate_limit` function exists
- Check server logs for errors
- Ensure your Supabase client has proper permissions

### Validation Errors
- Check the error details in the API response
- All validation errors include the field path and message
- Make sure you're sending data in the correct format

## 📝 Next Steps

1. ✅ Run the migration in Supabase (Step 1 above)
2. ✅ Verify everything was created (Steps 2-4)
3. ✅ Test your API endpoints
4. ✅ Monitor the `rate_limits` table to see it working

Your application is now secured with:
- ✅ Rate limiting (prevents API abuse)
- ✅ Input validation (prevents invalid data)
- ✅ Secure API keys (already in place)

---

**Need Help?** If you encounter any issues, check the error messages and let me know!

