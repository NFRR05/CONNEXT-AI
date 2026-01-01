# CONNEXT AI - Complete UX Flow Documentation (Twilio)

## 🎯 Overview

This document explains the complete user experience flow for both **Clients** and **Admins** when creating and deploying AI voice agents using **Twilio** (NOT Vapi).

---

## 📋 Table of Contents

1. [Client Flow - Requesting an Agent](#client-flow)
2. [Admin Flow - Approving & Deploying Agents](#admin-flow)
3. [Twilio Setup & Configuration](#twilio-setup)
4. [n8n Workflow Deployment](#n8n-workflow)
5. [Testing & Verification](#testing)
6. [Troubleshooting](#troubleshooting)

---

## 👤 CLIENT FLOW

### Step 1: Client Login
- **URL**: `http://localhost:3000/login` (or production URL)
- Client logs in with email/password or magic link
- Redirected to client dashboard

### Step 2: Navigate to Request Creation
- **URL**: `http://localhost:3000/client/requests/create`
- Client clicks "Create Agent Request" or navigates to Requests page

### Step 3: Complete 6-Step Form

#### **Step 1: Business Type**
- Select one or more business types:
  - Restaurant, Dental Clinic, Medical Practice, Law Firm, Real Estate, Fitness/Gym, Beauty Salon, Auto Repair, Home Services, Retail Store, Other
- If "Other" selected, specify business type in text field
- **Required**: At least one selection

#### **Step 2: Agent Purpose**
- Select what the agent should do:
  - Book Appointments
  - Answer Questions
  - Collect Customer Information
  - Provide Quotes/Estimates
  - Handle Complaints
  - Process Orders
  - Schedule Services
  - Qualify Leads
- **Required**: At least one selection

#### **Step 3: Information to Collect**
- Select what information the agent must collect:
  - Name, Phone Number, Email Address, Preferred Date/Time, Service Type, Location/Address, Budget/Price Range, Special Requirements, Insurance Information, Referral Source
- **Required**: At least one selection

#### **Step 4: Tone & Personality**
- Select how the agent should sound:
  - Professional & Formal
  - Friendly & Casual
  - Warm & Welcoming
  - Efficient & Direct
  - Empathetic & Caring
  - Enthusiastic & Energetic
- **Required**: At least one selection

#### **Step 5: Final Details**
- **Agent Name** (Optional): Custom name for the agent
- **Additional Information** (Optional): Specific rules, requirements, or special instructions
  - Example: "Only accept bookings during business hours (9 AM - 6 PM)"
  - Example: "Ask about dietary restrictions for restaurants"

#### **Step 6: Workflow Configuration** (Optional)
- **Data Validation**:
  - ✅ Validate phone numbers
  - ✅ Validate email addresses
  - ✅ Filter out test calls
  - Minimum call duration (seconds)
- **Error Handling**:
  - ✅ Retry failed requests automatically
  - Max retries (1-10)
  - Error notifications via email
- **Data Transformation**:
  - ✅ Format phone numbers to international format
  - ✅ Extract structured data from transcripts
- **Smart Routing**:
  - Route by sentiment (positive/negative/all)
  - Route by call duration
  - Route by business hours

### Step 4: Submit Request
- Click "Submit Request" button
- Request is saved to database with status: `pending`
- Client sees success message: "Your request has been submitted and will be reviewed by an admin."
- Redirected to: `http://localhost:3000/client/requests`

### Step 5: Wait for Admin Approval
- Client can view request status on Requests page
- Statuses: `pending`, `approved`, `rejected`, `completed`, `cancelled`
- Client receives notification when admin approves/rejects

---

## 👨‍💼 ADMIN FLOW

### Step 1: Admin Login
- **URL**: `http://localhost:3000/login`
- Admin logs in with admin credentials
- Redirected to admin dashboard

### Step 2: Navigate to Requests Page
- **URL**: `http://localhost:3000/admin/requests`
- Admin sees all agent requests
- **Pending Requests** section shows requests awaiting review
- **Other Requests** section shows approved/rejected/completed requests

### Step 3: Review Request
- Click "Review" button on a pending request
- Modal opens showing:
  - **Request Details**:
    - Name
    - Description (auto-generated from form data)
    - Priority
    - Client email
    - Created date
  - **Workflow Preview** (for create requests):
    - Click "Preview Workflow" to see generated n8n blueprint JSON
    - Shows webhook URL and agent secret (temporary for preview)
  - **Admin Notes** textarea:
    - Add notes about the request
    - Visible to client if needed

### Step 4: Approve or Reject

#### **Option A: Approve Request**
1. Click "Approve" button
2. System automatically:
   - Creates agent in database
   - Generates API secret
   - Creates Twilio phone number (if not already exists)
   - Generates n8n workflow blueprint
   - Updates request status to `approved`
   - Links agent_id to request
3. Admin sees success message: "Request approved and agent created"
4. **IMPORTANT**: Admin must now manually:
   - Import n8n workflow (see [n8n Workflow Deployment](#n8n-workflow))
   - Configure Twilio webhooks (see [Twilio Setup](#twilio-setup))

#### **Option B: Reject Request**
1. Add rejection reason in Admin Notes
2. Click "Reject" button
3. Request status changes to `rejected`
4. Client is notified

### Step 5: Deploy n8n Workflow
- See [n8n Workflow Deployment](#n8n-workflow) section below

### Step 6: Configure Twilio
- See [Twilio Setup](#twilio-setup) section below

### Step 7: Test Agent
- See [Testing & Verification](#testing) section below

---

## 📞 TWILIO SETUP

### Prerequisites
- Twilio Account SID and Auth Token
- Twilio phone number purchased (or purchase one during agent creation)
- ngrok running (for local development) or production URL

### Step 1: Purchase Twilio Phone Number (if needed)
- If agent doesn't have a phone number yet:
  1. Go to Twilio Console → Phone Numbers → Buy a Number
  2. Select country/region
  3. Select capabilities (Voice, SMS)
  4. Purchase number
  5. Note the phone number SID and phone number

### Step 2: Link Phone Number to Agent
- In your database, update the agent:
  ```sql
  UPDATE agents
  SET 
    twilio_phone_number_sid = 'PNxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    twilio_phone_number = '+1234567890',
    provider_type = 'twilio'
  WHERE id = 'agent-uuid-here';
  ```

### Step 3: Configure Twilio Voice Webhooks
1. Go to Twilio Console → Phone Numbers → Manage → Active Numbers
2. Click on the phone number
3. Scroll to "Voice & Fax" section
4. Configure webhooks:
   - **A CALL COMES IN**:
     - Webhook URL: `https://YOUR_NGROK_URL.ngrok.io/api/twilio/voice?agent_id=AGENT_UUID`
     - HTTP Method: `POST`
   - **CALL STATUS CHANGES**:
     - Webhook URL: `https://YOUR_NGROK_URL.ngrok.io/api/twilio/status`
     - HTTP Method: `POST`
5. Click "Save"

### Step 4: Verify WebSocket Server is Running
- WebSocket server should be running on port 8080
- Check: `http://localhost:8080` (should show WebSocket server info)
- ngrok tunnel should be active: `ngrok http 8080`
- Update `.env.local`:
  ```
  TWILIO_WS_SERVER_URL=wss://YOUR_NGROK_URL.ngrok.io
  ```

---

## 🔄 N8N WORKFLOW DEPLOYMENT

### Step 1: Access n8n
- **URL**: `http://localhost:5678` (local) or production n8n URL
- Login with admin credentials

### Step 2: Import Workflow
1. Click "Add workflow" or "+" button
2. Click three dots menu (⋮) → "Import from File"
3. **Option A**: Import from JSON file (if admin downloaded blueprint)
   - Select the JSON file (e.g., `connext-ai-bella-napoli-ristorante-saronno.json`)
   - Click "Import"
4. **Option B**: Create workflow manually (if no JSON file)
   - See "Manual Workflow Creation" below

### Step 3: Update Workflow Configuration
1. Open the imported workflow
2. Find the "CONNEXT AI Ingest" node (HTTP Request node)
3. Update the URL:
   - Local: `https://YOUR_NGROK_URL.ngrok.io/api/webhooks/ingest`
   - Production: `https://yourdomain.com/api/webhooks/ingest`
4. Verify the `x-agent-secret` header matches the agent's API secret:
   - Get API secret from database:
     ```sql
     SELECT api_secret FROM agents WHERE id = 'agent-uuid';
     ```
   - Update header in n8n node

### Step 4: Configure Twilio Webhook Node (if manual creation)
- Add "Webhook" node
- Set method: `POST`
- Set path: `twilio-webhook`
- Copy the webhook URL (e.g., `http://localhost:5678/webhook/twilio-webhook`)
- Configure this URL in Twilio (see Twilio Setup Step 3)

### Step 5: Activate Workflow
1. Toggle "Inactive" to "Active" (top right of n8n workflow)
2. Workflow is now listening for webhooks
3. Test by making a call to the Twilio number

### Manual Workflow Creation (if no JSON file)

#### Node 1: Twilio Webhook
- **Type**: Webhook
- **Settings**:
  - HTTP Method: `POST`
  - Path: `twilio-webhook`
  - Response Mode: `Last Node`
- **Output**: Receives Twilio call data

#### Node 2: Extract Call Data
- **Type**: Function
- **Code**:
  ```javascript
  const callData = $input.item.json;
  return {
    json: {
      phone: callData.From || callData.from,
      summary: callData.CallSummary || callData.summary || '',
      transcript: callData.Transcript || callData.transcript || '',
      recording: callData.RecordingUrl || callData.recording_url || '',
      sentiment: callData.Sentiment || callData.sentiment || '',
      structured_data: callData.StructuredData || callData.structured_data || {},
      duration: callData.CallDuration || callData.duration || 0
    }
  };
  ```

#### Node 3: CONNEXT AI Ingest
- **Type**: HTTP Request
- **Settings**:
  - Method: `POST`
  - URL: `https://YOUR_NGROK_URL.ngrok.io/api/webhooks/ingest`
  - Authentication: None
  - Headers:
    - `x-agent-secret`: `YOUR_AGENT_API_SECRET`
    - `Content-Type`: `application/json`
  - Body (JSON):
    ```json
    {
      "phone": "={{ $json.phone }}",
      "summary": "={{ $json.summary }}",
      "transcript": "={{ $json.transcript }}",
      "recording": "={{ $json.recording }}",
      "sentiment": "={{ $json.sentiment }}",
      "structured_data": "={{ $json.structured_data }}",
      "duration": "={{ $json.duration }}"
    }
    ```

#### Connect Nodes:
- Twilio Webhook → Extract Call Data → CONNEXT AI Ingest

---

## ✅ TESTING & VERIFICATION

### Step 1: Verify Agent Exists
```sql
SELECT id, name, api_secret, provider_type, twilio_phone_number 
FROM agents 
WHERE id = 'agent-uuid';
```

### Step 2: Verify Twilio Webhooks
1. Make a test call to the Twilio number
2. Check Twilio Console → Monitor → Logs → Calls
3. Verify webhook was called
4. Check Next.js logs for incoming webhook

### Step 3: Verify WebSocket Connection
1. Check WebSocket server logs (should show connection from Twilio)
2. Check OpenAI Realtime API connection (should show audio streaming)
3. Listen to the call - AI should respond naturally

### Step 4: Verify n8n Workflow
1. Check n8n workflow execution history
2. Verify webhook was received
3. Verify data was sent to CONNEXT AI Ingest endpoint
4. Check for any errors

### Step 5: Verify Lead Creation
1. After call completes, check database:
   ```sql
   SELECT * FROM leads WHERE agent_id = 'agent-uuid' ORDER BY created_at DESC LIMIT 1;
   ```
2. Verify lead data:
   - Customer phone number
   - Call summary
   - Call transcript
   - Recording URL
   - Sentiment
   - Structured data
   - Duration

### Step 6: Verify Dashboard
1. Client logs in: `http://localhost:3000/client/leads`
2. Should see new lead in dashboard
3. Click on lead to view details
4. Verify all data is displayed correctly

---

## 🔧 TROUBLESHOOTING

### Issue: "This is a test account" message from Twilio
**Solution**:
- Twilio webhook is not configured correctly
- Check webhook URL in Twilio Console
- Verify ngrok is running and URL is correct
- Check agent exists in database with correct phone number

### Issue: WebSocket connection fails
**Solution**:
- Verify WebSocket server is running: `docker ps` (check websocket-server container)
- Verify ngrok tunnel is active: `ngrok http 8080`
- Check `TWILIO_WS_SERVER_URL` in `.env.local` (should be `wss://...`)
- Check WebSocket server logs for errors

### Issue: n8n workflow not receiving webhooks
**Solution**:
- Verify workflow is **Active** (toggle in top right)
- Check n8n webhook URL is correct in Twilio
- Verify n8n is accessible (check `http://localhost:5678`)
- Check n8n execution logs

### Issue: Lead not created in database
**Solution**:
- Check n8n workflow execution (look for errors)
- Verify `x-agent-secret` header matches agent's API secret
- Check Next.js API logs: `/api/webhooks/ingest`
- Verify agent exists in database

### Issue: AI voice sounds robotic
**Solution**:
- Check agent's `voice_id` in database (should be `nova` or `shimmer` for natural voice)
- Verify OpenAI Realtime API is being used (not TTS)
- Check WebSocket bridge is converting audio correctly

### Issue: Call hangs up immediately
**Solution**:
- Check Twilio webhook response (should return TwiML)
- Verify agent exists and is found by phone number
- Check Next.js logs for errors in `/api/twilio/voice`
- Verify WebSocket server URL is accessible

---

## 📊 COMPLETE FLOW DIAGRAM

```
CLIENT REQUEST FLOW:
┌─────────────┐
│   Client    │
│   Login     │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ Create Request   │
│ (6-step form)    │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Submit Request   │
│ Status: pending  │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Wait for Admin   │
└──────────────────┘

ADMIN APPROVAL FLOW:
┌─────────────┐
│   Admin     │
│   Login     │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ Review Request   │
│ (View details)   │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Approve Request  │
│ (Auto-creates     │
│  agent + phone)   │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Import n8n       │
│ Workflow         │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Configure Twilio │
│ Webhooks         │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Activate         │
│ Workflow         │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Test Agent       │
└──────────────────┘

CALL FLOW:
┌─────────────┐
│  Customer   │
│  Calls      │
│  Number     │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│ Twilio Receives  │
│ Call             │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Twilio Webhook   │
│ → Next.js        │
│ /api/twilio/voice│
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Next.js Creates  │
│ Call Session     │
│ + Returns TwiML  │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Twilio Media     │
│ Stream → WebSocket│
│ Server           │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ WebSocket Bridge │
│ → OpenAI Realtime│
│ API              │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ AI Conversation  │
│ (Real-time)      │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Call Ends        │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Twilio Webhook   │
│ → n8n            │
│ (Call data)      │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ n8n Processes    │
│ Data             │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ n8n → Next.js    │
│ /api/webhooks/   │
│ ingest           │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Lead Created in  │
│ Database         │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Client Sees Lead │
│ in Dashboard     │
└──────────────────┘
```

---

## 🎯 KEY POINTS TO REMEMBER

1. **Twilio Only**: This system uses Twilio (NOT Vapi) for telephony
2. **WebSocket Server**: Required for real-time AI conversations (runs on port 8080)
3. **n8n Workflow**: Must be imported and activated for each agent
4. **Agent Secret**: Unique API secret for each agent (used in webhook authentication)
5. **Phone Number**: Each agent needs a Twilio phone number linked
6. **Webhooks**: Twilio webhooks must point to Next.js app (via ngrok for local dev)
7. **Voice Selection**: Use `nova` or `shimmer` for natural-sounding AI voices

---

## 📝 QUICK REFERENCE

### Important URLs
- **Client Login**: `http://localhost:3000/login`
- **Client Requests**: `http://localhost:3000/client/requests`
- **Admin Requests**: `http://localhost:3000/admin/requests`
- **n8n**: `http://localhost:5678`
- **WebSocket Server**: `http://localhost:8080`

### Important Environment Variables
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WS_SERVER_URL=wss://YOUR_NGROK_URL.ngrok.io
NEXT_PUBLIC_APP_URL=https://YOUR_NGROK_URL.ngrok.io
OPENAI_API_KEY=sk-...
```

### Database Queries
```sql
-- Get agent details
SELECT * FROM agents WHERE id = 'agent-uuid';

-- Get agent's API secret
SELECT api_secret FROM agents WHERE id = 'agent-uuid';

-- Get recent leads
SELECT * FROM leads WHERE agent_id = 'agent-uuid' ORDER BY created_at DESC;

-- Update agent phone number
UPDATE agents 
SET twilio_phone_number = '+1234567890', 
    twilio_phone_number_sid = 'PN...',
    provider_type = 'twilio'
WHERE id = 'agent-uuid';
```

---

**Last Updated**: 2025-01-01
**Version**: 1.0
**Provider**: Twilio (NOT Vapi)

