# Production Guide: Multi-User Agent Creation

**For when you go live:** How to allow multiple users to create their own AI agents.

---

## 🎯 Overview

When you go live, multiple users will create their own agents. This guide explains:
- How the system handles multiple users
- How each user creates their agent
- Security and isolation
- Best practices for production

---

## 📋 How It Works

### User Isolation
- Each user can create **ONE agent** (enforced by system)
- Users can only see/edit their own agents
- Database uses `user_id` to separate data
- Webhooks automatically route to the correct user's agent

### Agent Creation Flow
1. User signs up/logs in
2. User creates agent (via API or Retell Dashboard)
3. System links agent to user's account
4. User gets their own phone number
5. All calls/leads are tied to that user

---

## 🚀 Option 1: Users Create Agents via Your App (Recommended)

### How It Works
Users use your app's UI to create agents. Your backend handles everything automatically.

### User Experience

**Step 1: User Signs Up**
- User creates account in your app
- Gets authenticated via Supabase

**Step 2: User Creates Agent**
- User goes to "Create Agent" page in your app
- Fills out form:
  - Agent name
  - Description (what the agent should do)
  - Voice selection
  - Area code for phone number
- Clicks "Create Agent"

**Step 3: Backend Handles Everything**
- Your backend creates Retell agent
- Purchases phone number
- Saves to database with `user_id`
- Returns agent details to user

**Step 4: User Sees Their Agent**
- Agent appears in their dashboard
- They can see phone number, settings, etc.
- They can make test calls

### Implementation

**Frontend Form Example:**
```typescript
// User fills this form in your app
{
  name: "My Customer Service Agent",
  description: "A friendly agent that helps customers...",
  voice_id: "11labs-Jenny",
  area_code: "415"
}
```

**Backend API Call:**
```typescript
// Your app automatically calls:
POST /api/agents
{
  description: "...",
  name: "...",
  provider_type: "retell",
  area_code: "415",
  voice_id: "11labs-Jenny"
}
// Backend automatically uses the logged-in user's ID
```

**What Happens:**
1. Backend gets `user_id` from session (automatic)
2. Creates Retell agent
3. Purchases phone number
4. Saves to database with `user_id`
5. Returns agent to user

**No manual database work needed!** Everything is automatic.

---

## 🔧 Option 2: Users Create Agents in Retell, Then Connect (Manual)

If users want to create agents directly in Retell Dashboard first, then connect them.

### User Experience

**Step 1: User Creates Agent in Retell**
- User goes to Retell Dashboard
- Creates agent (as in the simple guide)
- Gets Agent ID and Phone Number ID

**Step 2: User Connects Agent in Your App**
- User goes to "Connect Agent" page in your app
- Enters:
  - Retell Agent ID
  - Retell Phone Number ID
  - Agent name
  - System prompt (optional - can copy from Retell)
- Clicks "Connect"

**Step 3: Backend Links Agent**
- Your backend saves agent to database with `user_id`
- Links Retell agent to user's account
- User can now see agent in dashboard

### Implementation

**Create API Endpoint:**
```typescript
// app/api/agents/connect/route.ts
POST /api/agents/connect
{
  retell_agent_id: "oBeDLoLOeuAbiuaMFXRtDOLriTJ5tSxD",
  retell_phone_number_id: "pn_abc123",
  name: "My Agent",
  system_prompt: "..." // Optional
}
```

**Backend Logic:**
1. Get `user_id` from session
2. Verify Retell agent exists (optional - call Retell API)
3. Save to database with `user_id`
4. Return success

---

## 🔒 Security & Isolation

### Database Level

**Row Level Security (RLS) Policies:**
```sql
-- Users can only see their own agents
CREATE POLICY "Users can view own agents"
  ON agents FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only create agents for themselves
CREATE POLICY "Users can create own agents"
  ON agents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own agents
CREATE POLICY "Users can update own agents"
  ON agents FOR UPDATE
  USING (auth.uid() = user_id);
```

**Already configured in your schema!** ✅

### API Level

**Your API automatically:**
- Gets `user_id` from session (no way to fake it)
- Only returns user's own agents
- Only allows creating one agent per user
- Validates all inputs

**Example:**
```typescript
// app/api/agents/route.ts
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Only get THIS user's agents
  const { data: agents } = await supabase
    .from('agents')
    .select('*')
    .eq('user_id', user.id) // Automatic filtering
}
```

### Webhook Level

**Webhooks automatically route to correct user:**
```typescript
// app/api/retell/webhook/route.ts
case 'call_started': {
  // Find agent by retell_agent_id
  const { data: agent } = await supabase
    .from('agents')
    .select('id, user_id') // Gets the user_id
    .eq('retell_agent_id', call.agent_id)
  
  // Create call session with agent_id (linked to user)
  // User can only see calls for their own agents (RLS)
}
```

**Users automatically see only their own:**
- Call sessions
- Leads
- Recordings
- Transcripts

---

## 📊 Database Structure

### Agents Table
```
agents
├── id (UUID) - Primary key
├── user_id (UUID) - Links to auth.users
├── name (TEXT)
├── retell_agent_id (TEXT) - Retell's agent ID
├── retell_phone_number_id (TEXT) - Retell's phone number ID
├── system_prompt (TEXT)
├── voice_id (TEXT)
├── api_secret (TEXT) - For webhook auth
└── created_at (TIMESTAMP)
```

**Key Point:** `user_id` links every agent to a specific user.

### Call Sessions Table
```
retell_call_sessions
├── id (UUID)
├── agent_id (UUID) - Links to agents.id
├── call_id (TEXT) - Retell's call ID
├── from_number (TEXT)
├── to_number (TEXT)
├── transcript (TEXT)
├── recording_url (TEXT)
└── ...
```

**Key Point:** `agent_id` links calls to agents, which links to users.

### Leads Table
```
leads
├── id (UUID)
├── agent_id (UUID) - Links to agents.id
├── customer_phone (TEXT)
├── call_transcript (TEXT)
├── call_summary (TEXT)
└── ...
```

**Key Point:** `agent_id` links leads to agents, which links to users.

**Result:** Users can only see their own data (enforced by RLS).

---

## 🎨 UI/UX Recommendations

### Dashboard for Users

**Agent Overview Page:**
- Show user's agent (if exists)
- Display:
  - Agent name
  - Phone number
  - Status (active/inactive)
  - Total calls
  - Recent calls
- "Create Agent" button (if no agent)
- "Edit Agent" button (if agent exists)

**Create Agent Page:**
- Simple form:
  - Agent name
  - Description (textarea)
  - Voice selection (dropdown)
  - Area code (input)
- "Create Agent" button
- Loading state while creating
- Success message with phone number

**Agent Settings Page:**
- Edit agent name
- View/Edit system prompt
- View phone number
- View Retell Agent ID (for reference)
- "Delete Agent" button (with confirmation)

### Admin Dashboard (Optional)

**View All Users:**
- List of all users
- Number of agents per user
- Total calls per user
- User status (active/inactive)

**View All Agents:**
- List of all agents
- Which user owns each agent
- Agent status
- Phone numbers

---

## 🔄 Webhook Configuration

### Single Webhook URL for All Users

**You only need ONE webhook URL:**
```
https://your-production-domain.com/api/retell/webhook
```

**Why it works:**
- Retell sends `agent_id` in webhook payload
- Your backend looks up agent by `retell_agent_id`
- Finds the `user_id` automatically
- Routes to correct user's data

**No per-user webhook URLs needed!** ✅

### Webhook Flow for Multiple Users

```
User A's Customer Calls
  ↓
Retell sends webhook with agent_id_A
  ↓
Your backend finds agent by retell_agent_id
  ↓
Gets user_id_A from agent record
  ↓
Creates call session with agent_id (links to user A)
  ↓
User A sees call in their dashboard
```

```
User B's Customer Calls (at same time)
  ↓
Retell sends webhook with agent_id_B
  ↓
Your backend finds agent by retell_agent_id
  ↓
Gets user_id_B from agent record
  ↓
Creates call session with agent_id (links to user B)
  ↓
User B sees call in their dashboard
```

**Both users' calls are handled correctly, automatically!**

---

## ✅ Production Checklist

### Before Going Live

- [ ] **Database RLS Policies** - Verify all tables have proper RLS
- [ ] **API Authentication** - All endpoints require auth
- [ ] **Rate Limiting** - Prevent abuse (already implemented)
- [ ] **Error Handling** - Graceful error messages
- [ ] **Logging** - Log important events
- [ ] **Webhook URL** - Set production webhook URL in Retell
- [ ] **Environment Variables** - All secrets configured
- [ ] **Database Backups** - Automated backups enabled

### Testing Multi-User

- [ ] **Test User A creates agent** - Should work
- [ ] **Test User B creates agent** - Should work
- [ ] **Test User A only sees their agent** - User B's agent hidden
- [ ] **Test User A's customer calls** - Call appears for User A only
- [ ] **Test User B's customer calls** - Call appears for User B only
- [ ] **Test concurrent calls** - Both users' calls handled correctly
- [ ] **Test webhook routing** - Calls go to correct users

### Monitoring

- [ ] **Monitor API errors** - Set up error tracking
- [ ] **Monitor webhook failures** - Log failed webhooks
- [ ] **Monitor database performance** - Check query times
- [ ] **Monitor Retell API usage** - Track API calls
- [ ] **Set up alerts** - For critical errors

---

## 🚨 Common Issues & Solutions

### Issue: User sees another user's agent

**Cause:** RLS policy not working correctly

**Solution:**
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'agents';

-- Should show: rowsecurity = true

-- Check policies exist
SELECT * FROM pg_policies WHERE tablename = 'agents';
```

### Issue: Webhook creates call for wrong user

**Cause:** `retell_agent_id` mismatch

**Solution:**
- Verify `retell_agent_id` in database matches Retell Dashboard
- Check webhook logs for which `agent_id` Retell sent
- Verify agent lookup query is correct

### Issue: User can't create second agent

**Cause:** One agent per user limit (by design)

**Solution:**
- This is intentional! Users can only have one agent
- If they want to change, they should update existing agent
- Or delete and create new one

### Issue: Multiple users' calls get mixed up

**Cause:** Webhook routing issue

**Solution:**
- Check webhook handler logs
- Verify `retell_agent_id` lookup is working
- Test with two different users' agents
- Check database - each call should have correct `agent_id`

---

## 📈 Scaling Considerations

### Database

**Indexes (already created):**
```sql
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_retell_agent_id ON agents(retell_agent_id);
CREATE INDEX idx_retell_call_sessions_agent_id ON retell_call_sessions(agent_id);
CREATE INDEX idx_leads_agent_id ON leads(agent_id);
```

**These ensure fast queries even with thousands of users.**

### API Rate Limiting

**Already implemented:**
- 3 agents per hour per user
- Webhook rate limiting per agent secret

**For production, consider:**
- Increase limits if needed
- Add per-user API rate limits
- Monitor and adjust based on usage

### Retell API

**Retell handles:**
- Multiple concurrent calls
- High call volumes
- Phone number management

**You just need to:**
- Handle webhooks quickly (return 200 OK fast)
- Store data efficiently
- Don't block webhook processing

---

## 🎯 Best Practices

### For Users

1. **One Agent Per User** - Keep it simple
2. **Clear System Prompts** - Better agent performance
3. **Test Before Going Live** - Make test calls first
4. **Monitor Calls** - Review transcripts regularly
5. **Update Prompts** - Improve based on real calls

### For You (Developer)

1. **Monitor Webhooks** - Set up alerts for failures
2. **Log Everything** - Helps debug issues
3. **Test Regularly** - Test with multiple users
4. **Backup Database** - Regular automated backups
5. **Update Retell SDK** - Keep dependencies updated
6. **Monitor Costs** - Track Retell API usage
7. **User Support** - Help users create agents

---

## 📝 Example: Two Users Creating Agents

### User A: Pizza Restaurant

1. Signs up → `user_id: abc123`
2. Creates agent → "Pizza Order Agent"
3. Gets phone number → `+14155551234`
4. Customer calls → Call appears in User A's dashboard

### User B: Hair Salon

1. Signs up → `user_id: xyz789`
2. Creates agent → "Appointment Booking Agent"
3. Gets phone number → `+14155555678`
4. Customer calls → Call appears in User B's dashboard

**Both work simultaneously, completely isolated!** ✅

---

## 🔗 Related Files

- **Agent Creation API:** `app/api/agents/route.ts`
- **Webhook Handler:** `app/api/retell/webhook/route.ts`
- **Database Schema:** `supabase/schema.sql`
- **RLS Policies:** Already in schema.sql
- **Simple Guide:** `AGENT-CREATION-GUIDE.md` (for single user)

---

## 🎉 Summary

**Multi-user support is already built in!**

- ✅ Database uses `user_id` for isolation
- ✅ RLS policies enforce security
- ✅ API automatically filters by user
- ✅ Webhooks route correctly
- ✅ One webhook URL for all users

**You just need to:**
1. Let users create agents (via your app UI)
2. Set one webhook URL in Retell
3. Monitor and support users

**That's it!** 🚀

