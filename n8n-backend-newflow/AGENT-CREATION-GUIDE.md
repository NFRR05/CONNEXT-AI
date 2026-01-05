# Guide: Create Your First AI Agent with n8n + CONNEXT AI

**Architecture:** Build your AI agent in n8n, powered by Twilio/Retell/Vapi, and send data to CONNEXT AI dashboard.

---

## 🏗️ How It Works

```
┌─────────────────────────────────────┐
│  Voice Provider (Twilio/Retell/Vapi)│
│  - Handles phone calls/SMS          │
│  - Sends webhooks to n8n            │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  n8n Workflow (YOUR BACKEND)         │
│  - Receives webhooks                 │
│  - AI Agent processes conversation   │
│  - Sends responses back              │
│  - Extracts data after call ends     │
│  - POSTs to CONNEXT AI               │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  CONNEXT AI (YOUR DASHBOARD)         │
│  - Receives call data                │
│  - Stores in database                │
│  - Displays in dashboard             │
└──────────────────────────────────────┘
```

**Key Point:** n8n IS your backend. CONNEXT AI is just the dashboard.

---

## 📋 Prerequisites

1. **n8n instance** (self-hosted or cloud)
2. **Voice provider account** (Twilio, Retell, or Vapi)
3. **CONNEXT AI account** (to get your agent secret)

---

## 🚀 Step-by-Step Setup

### Step 1: Create Agent in CONNEXT AI

1. Log into CONNEXT AI Dashboard
2. Go to **Agents** → **Create Agent**
3. Fill in:
   - **Name:** Your agent name (e.g., "Pizza Order Agent")
   - **Description:** What your agent does
4. Click **Create**
5. **Copy the `api_secret`** - You'll need this for n8n!

---

### Step 2: Set Up Voice Provider

#### Option A: Using Retell
1. Go to https://dashboard.retellai.com
2. Create an agent
3. Get a phone number
4. Configure webhook URL to point to your **n8n workflow** (not CONNEXT AI!)

#### Option B: Using Twilio
1. Go to https://console.twilio.com
2. Get a phone number
3. Configure webhook URL to point to your **n8n workflow**

#### Option C: Using Vapi
1. Go to https://dashboard.vapi.ai
2. Create an assistant
3. Get a phone number
4. Configure webhook URL to point to your **n8n workflow**

---

### Step 3: Build n8n Workflow

#### 3.1 Webhook Trigger Node
- **Node Type:** Webhook
- **Method:** POST
- **Path:** `/voice-webhook` (or any path you want)
- **This receives webhooks from your voice provider**

#### 3.2 AI Agent Node
- **Node Type:** OpenAI / Anthropic / etc.
- **Process the conversation**
- **Generate responses**
- **Send responses back to voice provider**

#### 3.3 Response to Voice Provider
- **Node Type:** HTTP Request
- **Send response back** to voice provider
- **Format:** `{"text": "Your response here"}`

#### 3.4 Extract Data (After Call Ends)
- **Node Type:** Code / Function
- **Extract:**
  - Phone number
  - Transcript
  - Recording URL
  - Duration
  - Sentiment
  - Structured data (customer name, order details, etc.)

#### 3.5 Send to CONNEXT AI
- **Node Type:** HTTP Request
- **Method:** POST
- **URL:** `https://your-domain.com/api/webhooks/ingest`
- **Headers:**
  ```
  Content-Type: application/json
  x-agent-secret: YOUR_AGENT_SECRET_FROM_STEP_1
  ```
- **Body (JSON):**
  ```json
  {
    "phone": "+1234567890",
    "summary": "Customer wants pizza",
    "transcript": "Full conversation...",
    "recording": "https://...",
    "sentiment": "positive",
    "structured_data": {
      "customer_name": "John",
      "order": "pizza"
    },
    "duration": 120
  }
  ```

---

### Step 4: Configure Voice Provider Webhook

Point your voice provider's webhook URL to your **n8n workflow webhook URL**, not CONNEXT AI!

**Example:**
- **n8n Webhook URL:** `https://your-n8n.com/webhook/voice-webhook`
- **Set this in your voice provider dashboard**

---

## 📊 Data Format Reference

See **[N8N-TO-CONNEXT-AI-INTEGRATION.md](./N8N-TO-CONNEXT-AI-INTEGRATION.md)** for the complete data format specification.

**Quick Reference:**
- **Endpoint:** `POST /api/webhooks/ingest`
- **Header:** `x-agent-secret: YOUR_AGENT_SECRET`
- **Body:** JSON with `phone`, `summary`, `transcript`, `recording`, `sentiment`, `structured_data`, `duration`

---

## ✅ Testing

1. **Make a test call** to your voice provider number
2. **Have a conversation** with your AI agent
3. **End the call**
4. **Check n8n workflow** - Should process and send to CONNEXT AI
5. **Check CONNEXT AI dashboard** - Should see the new lead!

---

## 🎯 What You'll See in CONNEXT AI

After n8n sends data, you'll see in your dashboard:
- ✅ Customer phone number
- ✅ Call transcript
- ✅ Recording (if provided)
- ✅ Summary
- ✅ Sentiment analysis
- ✅ Structured data (orders, names, etc.)
- ✅ Call duration

---

## 🆘 Troubleshooting

### "No data in CONNEXT AI dashboard"
- Check n8n workflow executed successfully
- Verify `x-agent-secret` header is correct
- Check n8n execution logs for errors
- Verify CONNEXT AI endpoint URL is correct

### "Invalid agent secret"
- Get the correct `api_secret` from CONNEXT AI dashboard
- Make sure you're using the right secret for the right agent

### "Voice provider not calling n8n"
- Verify webhook URL in voice provider points to n8n (not CONNEXT AI!)
- Check n8n webhook is active and accessible
- Test webhook with a tool like Postman

---

## 📚 Next Steps

1. **Learn n8n:** Build more complex workflows
2. **Extract more data:** Use AI to extract structured information
3. **Add logic:** Route calls based on sentiment, duration, etc.
4. **View dashboard:** See all your leads in CONNEXT AI

---

## 💡 Key Takeaways

- ✅ **n8n = Backend** (handles all conversation logic)
- ✅ **CONNEXT AI = Dashboard** (just displays data)
- ✅ **Voice Provider → n8n** (webhooks go to n8n)
- ✅ **n8n → CONNEXT AI** (data goes to dashboard)
- ✅ **No code needed** - Everything visual in n8n!

---

## 📖 Additional Resources

- **[N8N-TO-CONNEXT-AI-INTEGRATION.md](./N8N-TO-CONNEXT-AI-INTEGRATION.md)** - Complete data format specification
- n8n Documentation: https://docs.n8n.io
- Retell Documentation: https://docs.retellai.com
- Twilio Documentation: https://www.twilio.com/docs
- Vapi Documentation: https://docs.vapi.ai

---

**Ready to build? Start with Step 1!** 🚀

