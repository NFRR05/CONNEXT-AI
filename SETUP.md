# CONNEXT AI - Setup Documentation

This document explains the project structure, setup instructions, and what has been created in the base setup.

## What Has Been Created

### 1. Project Foundation

#### Next.js 14 Configuration
- **`package.json`**: Contains all dependencies including Next.js 14, React 18, Supabase, OpenAI, and ShadcnUI components
- **`tsconfig.json`**: TypeScript configuration with strict mode enabled and path aliases configured
- **`next.config.js`**: Next.js configuration file
- **`.eslintrc.json`**: ESLint configuration for Next.js
- **`.gitignore`**: Git ignore rules including environment files and build artifacts

#### Styling Setup
- **`tailwind.config.ts`**: Tailwind CSS configuration with ShadcnUI theme variables and custom animations
- **`postcss.config.js`**: PostCSS configuration for Tailwind
- **`components.json`**: ShadcnUI configuration file
- **`app/globals.css`**: Global styles with CSS variables for theming (light/dark mode support)

### 2. Database & Authentication

#### Supabase Integration
- **`lib/supabase/client.ts`**: Browser-side Supabase client for client components
- **`lib/supabase/server.ts`**: Server-side Supabase client for server components and API routes
- **`lib/supabase/middleware.ts`**: Middleware helper for session management
- **`middleware.ts`**: Next.js middleware that handles authentication and session refresh

#### Database Schema
- **`supabase/schema.sql`**: Complete database schema including:
  - **`profiles`** table: Extends Supabase auth.users with subscription tier
  - **`agents`** table: Stores Vapi agent configurations with API secrets
  - **`leads`** table: Stores incoming call data with JSONB for flexible structured data
  - **Row Level Security (RLS) policies**: Ensures users can only access their own data
  - **Triggers**: Auto-creates profiles on user signup and updates timestamps
  - **Indexes**: Optimized for common query patterns

#### Type Definitions
- **`types/database.ts`**: Complete TypeScript type definitions for all database tables

### 3. Project Structure

#### App Router Pages
- **`app/layout.tsx`**: Root layout with metadata and font configuration
- **`app/page.tsx`**: Home page placeholder
- **`app/(auth)/login/page.tsx`**: Login page placeholder (route group for authentication)
- **`app/(dashboard)/agents/page.tsx`**: Agents management page placeholder
- **`app/(dashboard)/leads/page.tsx`**: Leads dashboard page placeholder

#### API Routes
- **`app/api/webhooks/ingest/route.ts`**: Webhook endpoint that receives data from n8n
  - Validates `x-agent-secret` header
  - Inserts lead data into database
  - Handles missing fields gracefully
- **`app/api/agents/route.ts`**: Agent management API
  - `GET`: Fetches user's agents
  - `POST`: Creates new agent with generated API secret

### 4. External API Integrations

#### Vapi.ai Integration
- **`lib/vapi/client.ts`**: Functions for interacting with Vapi.ai API
  - `createAssistant()`: Creates a voice assistant
  - `createPhoneNumber()`: Provisions a phone number

#### OpenAI Integration
- **`lib/openai/client.ts`**: Functions for OpenAI API
  - `generateAgentConfig()`: Converts user description into agent configuration (system prompt, voice ID, tools)

#### n8n Blueprint Generator
- **`lib/n8n/generator.ts`**: Generates downloadable n8n workflow JSON files
  - `generateN8nBlueprint()`: Creates workflow with pre-configured webhook to CONNEXT AI
  - `blueprintToJson()`: Converts blueprint to downloadable JSON string

### 5. UI Components (ShadcnUI)

Base components installed and configured:
- **`components/ui/button.tsx`**: Button component with variants
- **`components/ui/card.tsx`**: Card component with header, content, footer
- **`components/ui/input.tsx`**: Input field component
- **`components/ui/label.tsx`**: Label component for forms

### 6. Utilities

- **`lib/utils.ts`**: Utility functions including `cn()` for class name merging (used by ShadcnUI)

### 7. Configuration Files

- **`env.example`**: Template for environment variables (copy to `.env.local`)
- **`README.md`**: Project overview and quick start guide

## Setup Instructions

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Environment Variables

1. Copy `env.example` to `.env.local`:
   ```bash
   cp env.example .env.local
   ```

2. Fill in your environment variables in `.env.local`:
   - **Supabase**: Get your project URL and keys from your Supabase project settings
   - **Vapi.ai**: Get your API key from Vapi.ai dashboard
   - **OpenAI**: Get your API key from OpenAI platform
   - **App URL**: Set to `http://localhost:3000` for development

### Step 3: Set Up Supabase Database

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Go to the SQL Editor in your Supabase dashboard

3. Run the SQL schema from `supabase/schema.sql`:
   - Copy the entire contents of `supabase/schema.sql`
   - Paste into the SQL Editor
   - Execute the query

4. Verify the tables were created:
   - Go to Table Editor
   - You should see: `profiles`, `agents`, and `leads` tables

5. Verify RLS policies:
   - Go to Authentication > Policies
   - You should see policies for all three tables

### Step 4: Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Architecture

### Data Flow

```
User Browser
    ↓
Next.js App (Dashboard)
    ↓
API Routes (/api/agents, /api/webhooks/ingest)
    ↓
Supabase (Database + Auth)
    ↑
n8n Workflow (User's instance)
    ↑
Vapi.ai (Voice AI)
```

### Authentication Flow

1. User signs up/logs in via Supabase Auth (Magic Link or Email/Password)
2. Middleware (`middleware.ts`) validates session on each request
3. Server components use `lib/supabase/server.ts` to access user data
4. Client components use `lib/supabase/client.ts` for client-side operations

### Data Flow (n8n-First Architecture)

1. Customer calls phone number (Twilio/Retell/Vapi)
2. Voice provider sends webhook to **n8n workflow** (not CONNEXT AI)
3. **n8n workflow** processes conversation using AI nodes
4. **n8n workflow** sends responses back to voice provider
5. After call ends, **n8n workflow** extracts data and POSTs to CONNEXT AI `/api/webhooks/ingest`
6. CONNEXT AI validates `x-agent-secret` header
7. Lead is inserted into database
8. Dashboard updates in real-time via Supabase Realtime subscriptions

**Key Point**: All conversation logic happens in n8n. CONNEXT AI only receives final data.

## Next Steps for Implementation

### Phase 1: Authentication (Days 1-2)
- [ ] Implement Magic Link authentication UI
- [ ] Create email/password login form
- [ ] Add protected route handling
- [ ] Test authentication flow

### Phase 2: Agent Generator (Days 3-5)
- [ ] Build "Create Agent" UI form
- [ ] Implement OpenAI prompt engineering integration
- [ ] Connect to Vapi API to create assistants
- [ ] Generate and download n8n blueprint JSON
- [ ] Display created agents in dashboard

### Phase 3: Dashboard (Days 6-7)
- [ ] Build leads table using ShadcnUI DataTable
- [ ] Implement Supabase Realtime subscriptions
- [ ] Create lead details modal/page
- [ ] Add audio player for recordings
- [ ] Implement filtering and sorting

### Phase 4: Polish & Launch (Days 8-10)
- [ ] Add error handling and loading states
- [ ] Create setup guide UI for n8n integration
- [ ] Add phone number provisioning UI
- [ ] Write user documentation
- [ ] Deploy to Vercel

## Key Files Reference

### Configuration
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `next.config.js` - Next.js configuration

### Database
- `supabase/schema.sql` - Database schema and migrations
- `types/database.ts` - TypeScript types for database

### API Routes
- `app/api/webhooks/ingest/route.ts` - Webhook receiver
- `app/api/agents/route.ts` - Agent CRUD operations

### Utilities
- `lib/supabase/` - Supabase client utilities
- `lib/vapi/client.ts` - Vapi.ai integration
- `lib/openai/client.ts` - OpenAI integration
- `lib/n8n/generator.ts` - n8n blueprint generator
- `lib/utils.ts` - General utilities

### Components
- `components/ui/` - ShadcnUI components
- `app/` - Next.js pages and layouts

## Security Considerations

1. **API Secrets**: Each agent has a unique `api_secret` generated using `crypto.randomUUID()`. This is used to authenticate webhook requests from n8n.

2. **Row Level Security**: All database tables have RLS policies ensuring users can only access their own data.

3. **Environment Variables**: Sensitive keys are stored in `.env.local` (not committed to git).

4. **Middleware**: Authentication is enforced at the middleware level for protected routes.

## Troubleshooting

### Database Connection Issues
- Verify Supabase URL and keys in `.env.local`
- Check that RLS policies are enabled
- Ensure the schema has been run successfully

### API Route Errors
- Check that environment variables are set correctly
- Verify API keys are valid (Vapi, OpenAI)
- Check server logs for detailed error messages

### Authentication Issues
- Clear browser cookies and try again
- Verify Supabase Auth is enabled in your project
- Check middleware configuration

## Support

For issues or questions, refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vapi.ai Documentation](https://docs.vapi.ai)
- [ShadcnUI Documentation](https://ui.shadcn.com)

---

**Last Updated**: Base setup completed
**Version**: 1.0 (MVP)

