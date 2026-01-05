# Backend Rebuild: Twilio → Retell AI Migration

## Overview

This document outlines the complete backend migration from Twilio Media Streams to Retell AI. The migration simplifies the architecture by removing the need for a custom WebSocket server and provides a more reliable, easier-to-maintain solution.

## What Changed

### ✅ Removed
- **WebSocket Server** (`server/websocket-server.ts`) - No longer needed
- **Twilio Realtime Bridge** (`lib/twilio/realtime-bridge.ts`) - Replaced by Retell
- **Docker WebSocket Service** - Removed from `docker-compose.n8n.yml`
- **Dockerfile.websocket** - No longer needed
- **WebSocket npm scripts** - Removed from `package.json`

### ✅ Added
- **Retell SDK** - `retell-sdk` package installed
- **Retell Client Library** - `lib/retell/client.ts`
- **Retell Agent Helpers** - `lib/retell/agent.ts`
- **Retell Webhook Receiver** - `app/api/retell/webhook/route.ts`
- **Retell Call Management** - `app/api/retell/call/route.ts`
- **Database Schema Updates** - Retell-specific tables and columns

### ✅ Modified
- **Agent Creation** - Now supports Retell AI (default) and Twilio (legacy)
- **Database Schema** - Added `retell_agent_id`, `retell_phone_number_id`, `provider_type` columns
- **Docker Compose** - Removed websocket-server service

## Architecture Comparison

### Before (Twilio)
```
┌─────────────┐
│   Next.js   │
│   Backend   │
└──────┬──────┘
       │
       ├──► Supabase (Database)
       ├──► n8n (Orchestration)
       └──► WebSocket Server (Docker)
              │
              ├──► Twilio Media Streams
              └──► OpenAI Realtime API
```

### After (Retell AI)
```
┌─────────────┐
│   Next.js   │
│   Backend   │
└──────┬──────┘
       │
       ├──► Supabase (Database)
       ├──► n8n (Orchestration)
       └──► Retell AI API
              │
              └──► Handles everything:
                   - Telephony
                   - STT/TTS
                   - Voice AI
                   - WebSocket/Media
```

## Setup Instructions

### 1. Environment Variables

Add to `.env.local`:

```bash
# Retell AI Configuration (REQUIRED)
RETELL_API_KEY=your_retell_api_key_here
RETELL_WEBHOOK_SECRET=your_webhook_secret_here  # Optional but recommended

# Remove these (no longer needed):
# TWILIO_ACCOUNT_SID
# TWILIO_AUTH_TOKEN
# TWILIO_WS_SERVER_URL
# OPENAI_API_KEY (if only used for Realtime API)
```

### 2. Database Migration

Run the updated schema to add Retell support:

```bash
# Connect to your Supabase database and run:
psql -h your-db-host -U postgres -d postgres -f supabase/schema.sql
```

Or use Supabase Dashboard → SQL Editor → Paste the schema updates.

**New Tables:**
- `retell_call_sessions` - Tracks Retell call sessions

**New Columns in `agents` table:**
- `retell_agent_id` - Retell agent ID
- `retell_phone_number_id` - Retell phone number ID
- `provider_type` - 'retell', 'twilio', or 'vapi' (default: 'retell')

### 3. Install Dependencies

```bash
npm install
```

The Retell SDK (`retell-sdk`) is already added to `package.json`.

### 4. Configure Retell Webhook

1. Go to Retell AI Dashboard → Settings → Webhooks
2. Add webhook URL: `https://your-domain.com/api/retell/webhook`
3. Select events: `call_started`, `call_ended`, `function_call`
4. Copy webhook secret to `.env.local` as `RETELL_WEBHOOK_SECRET`

### 5. Test the Integration

1. **Create an Agent:**
   ```bash
   POST /api/agents
   {
     "name": "Test Agent",
     "description": "A test agent",
     "provider_type": "retell"  # or omit for default
   }
   ```

2. **Make a Test Call:**
   - Use the Retell dashboard to test your agent
   - Or use the API: `POST /api/retell/call`

3. **Verify Webhook:**
   - Check logs for webhook events
   - Verify call session created in database
   - Check lead created in dashboard

## API Endpoints

### Retell Webhook
- **POST** `/api/retell/webhook` - Receives webhooks from Retell AI
- **GET** `/api/retell/webhook` - Health check

### Retell Call Management
- **POST** `/api/retell/call` - Create a new call
  ```json
  {
    "agent_id": "uuid",
    "from_number": "+1234567890",
    "to_number": "+0987654321",
    "metadata": {}
  }
  ```

- **GET** `/api/retell/call?call_id=xxx` - Get call status

### Agent Creation (Updated)
- **POST** `/api/agents` - Create agent (now supports Retell)
  ```json
  {
    "name": "Agent Name",
    "description": "Agent description",
    "provider_type": "retell",  // Optional, defaults to "retell"
    "voice_id": "11labs-Jenny",  // Optional
    "area_code": "415"           // Optional
  }
  ```

## Local Development

### Using ngrok (Recommended)

1. **Start Next.js:**
   ```bash
   npm run dev
   ```

2. **Expose with ngrok:**
   ```bash
   ngrok http 3000
   ```

3. **Update Retell Webhook URL:**
   - Use ngrok URL: `https://your-ngrok-url.ngrok.io/api/retell/webhook`

### Without ngrok

- You can test agent creation locally
- Webhooks require a public URL (use ngrok or deploy to VPS)

## Production Deployment

### VPS Deployment

1. **Deploy Next.js to VPS:**
   - Use PM2, Docker, or your preferred method
   - Ensure port 3000 (or your port) is accessible

2. **Set Environment Variables:**
   - Add `RETELL_API_KEY` and `RETELL_WEBHOOK_SECRET` to production env

3. **Update Retell Webhook:**
   - Point to your production domain: `https://yourdomain.com/api/retell/webhook`

4. **No WebSocket Server Needed:**
   - Retell handles all WebSocket connections
   - No need to run separate WebSocket server

### Docker (n8n only)

The `docker-compose.n8n.yml` now only includes:
- **n8n** - Workflow automation
- **postgres** - n8n database

No WebSocket server needed!

## Migration Checklist

- [x] Install Retell SDK
- [x] Create Retell client library
- [x] Update database schema
- [x] Create Retell webhook receiver
- [x] Create Retell call management API
- [x] Update agent creation to support Retell
- [x] Remove Twilio WebSocket server
- [x] Update docker-compose
- [ ] Add Retell API key to environment
- [ ] Run database migration
- [ ] Configure Retell webhook URL
- [ ] Test agent creation
- [ ] Test call flow
- [ ] Update n8n workflows (if needed)
- [ ] Deploy to production

## Cost Comparison

### Before (Twilio)
- Twilio: ~$0.0965/min
- OpenAI Realtime: ~$0.06/min
- Infrastructure: VPS costs
- **Total: ~$0.16/min + infrastructure**

### After (Retell AI)
- Retell: ~$0.08-0.11/min (all-inclusive)
- Infrastructure: Only Next.js hosting
- **Total: ~$0.10/min (no extra infrastructure)**

**Savings: ~40% cheaper + no infrastructure management**

## Troubleshooting

### Webhook Not Receiving Events

1. **Check webhook URL:**
   - Must be publicly accessible
   - Use ngrok for local testing
   - Verify URL in Retell dashboard

2. **Check webhook secret:**
   - Ensure `RETELL_WEBHOOK_SECRET` matches Retell dashboard

3. **Check logs:**
   - Look for `[Retell Webhook]` in server logs
   - Verify events are being received

### Agent Creation Fails

1. **Check API key:**
   - Verify `RETELL_API_KEY` is set correctly
   - Test with Retell dashboard

2. **Check voice ID:**
   - Use valid Retell voice ID
   - Default: `11labs-Jenny`

3. **Check system prompt:**
   - Must be a valid string
   - Not too long (Retell has limits)

### Calls Not Working

1. **Check agent ID:**
   - Verify `retell_agent_id` is set in database
   - Agent must be created in Retell first

2. **Check phone number:**
   - Verify phone number is purchased in Retell
   - Check `retell_phone_number_id` in database

3. **Check webhook:**
   - Webhook must be configured
   - Events must be enabled

## Next Steps

1. **Set up Retell account:**
   - Sign up at retellai.com
   - Get API key from dashboard
   - Add payment method

2. **Configure environment:**
   - Add `RETELL_API_KEY` to `.env.local`
   - Add `RETELL_WEBHOOK_SECRET` (optional but recommended)

3. **Run database migration:**
   - Execute updated schema.sql
   - Verify new columns exist

4. **Test integration:**
   - Create test agent
   - Make test call
   - Verify webhook events

5. **Update n8n workflows:**
   - Update webhook URLs if needed
   - Test end-to-end flow

## Support

- **Retell AI Docs:** https://docs.retellai.com
- **Retell AI Dashboard:** https://dashboard.retellai.com
- **Issues:** Check server logs for `[Retell]` prefix

## Rollback Plan

If you need to rollback to Twilio:

1. Set `provider_type: 'twilio'` when creating agents
2. Keep Twilio client library (still in codebase)
3. Re-add WebSocket server if needed
4. Update docker-compose to include websocket-server

However, Retell is recommended for easier maintenance and lower costs.

