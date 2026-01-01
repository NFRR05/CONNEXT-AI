# UX Restructure Plan

## 🎯 Overview

Restructuring the UX to match the new business model:
- **Clients**: Get ONE pre-built agent, can only request changes/deletes
- **Admin**: Manages all agents, merges agent/workflow pages

---

## 📋 Required Changes

### ✅ Database Changes

**Migration File**: `supabase/migrations/010_ux_restructure.sql`

**What it does**:
1. Removes duplicate agents (keeps most recent per user)
2. Adds unique constraint: **ONE agent per client** (`UNIQUE (user_id)`)

**Run this migration**:
```sql
-- In Supabase SQL Editor, run:
-- File: supabase/migrations/010_ux_restructure.sql
```

---

## 🔄 Code Changes Needed

### 1. **CLIENT ROUTES** (`app/client/`)

#### ✅ Keep (No Changes):
- `/client/dashboard` - Shows agent overview
- `/client/leads` - Shows leads from agent
- `/client/requests` - Ticket system (already exists)
- `/client/requests/[id]` - Request details (already exists)

#### ❌ Remove:
- `/client/requests/create` - **DELETE THIS** (clients can't create agents)

#### ➕ Add:
- `/client/agents/[id]/page.tsx` - **NEW**: Agent detail page (when clicking agent)

#### 🔧 Modify:
- `/client/agents/page.tsx` - Update to show single agent (not list)
- `/client/requests/create/page.tsx` - **REMOVE "create" option**, only allow "update" and "delete"

---

### 2. **ADMIN ROUTES** (`app/admin/`)

#### ✅ Keep (No Changes):
- `/admin/dashboard` - Admin dashboard
- `/admin/requests` - Request management

#### ❌ Remove:
- `/admin/agents/page.tsx` - **DELETE THIS** (merge into workflows)

#### 🔧 Modify:
- `/admin/workflows/page.tsx` - **RENAME to `/admin/agents/page.tsx`**
  - Show all agents
  - Show workflow JSON for each agent
  - Add link to agent detail: `/admin/agents/[id]`
  - Add delete agent functionality

#### ➕ Add:
- `/admin/agents/[id]/page.tsx` - **NEW**: Agent detail page with workflow JSON viewer

---

### 3. **API CHANGES**

#### 🔧 Modify:
- `/api/agents/route.ts` - **POST**: Add check to prevent creating second agent
  ```typescript
  // Check if user already has an agent
  const { data: existingAgent } = await supabase
    .from('agents')
    .select('id')
    .eq('user_id', user.id)
    .single()
  
  if (existingAgent) {
    return NextResponse.json(
      { error: 'You already have an agent. Please request changes instead.' },
      { status: 400 }
    )
  }
  ```

- `/api/agent-requests/route.ts` - **POST**: Remove "create" option for clients
  - Only allow "update" and "delete" request types

---

## 📁 File Structure After Changes

```
app/
├── client/
│   ├── dashboard/
│   │   └── page.tsx ✅ (keep)
│   ├── agents/
│   │   ├── page.tsx 🔧 (modify - show single agent)
│   │   └── [id]/
│   │       └── page.tsx ➕ (NEW - agent detail)
│   ├── leads/
│   │   └── page.tsx ✅ (keep)
│   └── requests/
│       ├── page.tsx ✅ (keep)
│       ├── [id]/
│       │   └── page.tsx ✅ (keep)
│       └── create/
│           └── page.tsx 🔧 (modify - remove "create" option)
│
├── admin/
│   ├── dashboard/
│   │   └── page.tsx ✅ (keep)
│   ├── requests/
│   │   └── page.tsx ✅ (keep)
│   └── agents/
│       ├── page.tsx 🔧 (rename from workflows/page.tsx)
│       └── [id]/
│           └── page.tsx ➕ (NEW - agent detail with workflow JSON)
│
└── (auth)/
    ├── login/
    │   └── page.tsx ✅ (keep - perfect as is)
    └── signup/
        └── page.tsx ✅ (keep - perfect as is)
```

---

## 🎨 UI Changes Summary

### **CLIENT SIDE**

1. **Dashboard** (`/client/dashboard`)
   - Shows their ONE agent
   - Click agent → goes to `/client/agents/[id]`

2. **Agents Page** (`/client/agents`)
   - Shows single agent card (not list)
   - Click "View Details" → `/client/agents/[id]`

3. **Agent Detail Page** (`/client/agents/[id]`) **NEW**
   - Agent name, phone number, status
   - System prompt preview
   - Voice settings
   - Recent leads count
   - Link to leads page filtered by this agent

4. **Requests Page** (`/client/requests`)
   - Remove "Create Agent Request" button
   - Only show "Update Agent" and "Delete Agent" options

5. **Leads Page** (`/client/leads`)
   - Keep as is (already shows leads from their agent)

---

### **ADMIN SIDE**

1. **Dashboard** (`/admin/dashboard`)
   - Keep as is

2. **Requests Page** (`/admin/requests`)
   - Keep as is

3. **Agents Page** (`/admin/agents`) **RENAMED FROM workflows**
   - Show all agents (all clients)
   - Each agent card shows:
     - Agent name
     - Client email
     - Workflow ID
     - Status (Active/Inactive)
     - Actions:
       - "View Details" → `/admin/agents/[id]`
       - "Download Workflow JSON"
       - "Delete Agent"

4. **Agent Detail Page** (`/admin/agents/[id]`) **NEW**
   - Full agent information
   - Workflow JSON viewer (pretty-printed)
   - Edit workflow JSON (if needed)
   - Delete agent button
   - Client information
   - Recent leads from this agent

---

## ✅ Implementation Checklist

### Database
- [x] Create migration: `010_ux_restructure.sql`
- [ ] **RUN MIGRATION** in Supabase SQL Editor

### Client Routes
- [ ] Modify `/client/agents/page.tsx` - Show single agent
- [ ] Create `/client/agents/[id]/page.tsx` - Agent detail page
- [ ] Modify `/client/requests/create/page.tsx` - Remove "create" option
- [ ] Update navigation to remove "Create Request" link

### Admin Routes
- [ ] Rename `/admin/workflows/page.tsx` → `/admin/agents/page.tsx`
- [ ] Update workflows page to show agents + workflows
- [ ] Create `/admin/agents/[id]/page.tsx` - Agent detail with JSON viewer
- [ ] Add delete agent functionality
- [ ] Update navigation links

### API Routes
- [ ] Modify `/api/agents/route.ts` - Prevent second agent creation
- [ ] Modify `/api/agent-requests/route.ts` - Remove "create" for clients

### Testing
- [ ] Test client can only see one agent
- [ ] Test client cannot create new agent request
- [ ] Test client can request update/delete
- [ ] Test admin can see all agents
- [ ] Test admin can view workflow JSON
- [ ] Test admin can delete agent

---

## 🚨 IMPORTANT: Run Database Migration First!

Before making code changes, **run the migration**:

1. Go to Supabase Dashboard → SQL Editor
2. Open file: `supabase/migrations/010_ux_restructure.sql`
3. Copy and paste into SQL Editor
4. Click **Run**

This will:
- Clean up any duplicate agents (keeps most recent)
- Add constraint preventing multiple agents per client

---

## 📝 Notes

- **Clients** = Regular users (role: 'client' or no role)
- **Admins** = Users with role: 'admin' or 'support'
- One agent per client is enforced at database level
- Admins can still see/manage all agents (no restriction)
- Landing page, login, signup stay the same ✅

---

**Created**: 2025-01-01  
**Status**: Ready for implementation

