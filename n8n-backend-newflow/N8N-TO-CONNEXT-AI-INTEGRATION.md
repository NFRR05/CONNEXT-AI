# n8n → CONNEXT AI Integration Guide

## 🎯 Overview

This guide shows you **exactly** what data CONNEXT AI expects when you send it from your n8n workflow.

**Remember:** 
- **n8n** = Your backend (handles conversations, AI logic)
- **CONNEXT AI** = Your dashboard (displays the data)

---

## 📡 Endpoint Details

**URL:** `https://your-domain.com/api/webhooks/ingest`  
**Method:** `POST`  
**Content-Type:** `application/json`

---

## 🔐 Authentication

You **MUST** include this header:

```
x-agent-secret: YOUR_AGENT_SECRET
```

**Where to get your Agent Secret:**
1. Go to CONNEXT AI Dashboard
2. Go to your Agent settings
3. Copy the `api_secret` value
4. Use it in the `x-agent-secret` header

---

## 📦 Request Body Format

CONNEXT AI expects a JSON object with these fields (all optional, but recommended):

```json
{
  "phone": "+1234567890",
  "summary": "Customer wants to order pizza",
  "transcript": "Full conversation transcript here...",
  "recording": "https://example.com/recording.mp3",
  "sentiment": "positive",
  "structured_data": {
    "customer_name": "John Doe",
    "order_type": "pizza",
    "quantity": 2,
    "total_price": 28.00
  },
  "duration": 120
}
```

---

## 📋 Field Specifications

### `phone` (Optional)
- **Type:** String
- **Format:** E.164 format (must start with `+`)
- **Max Length:** 20 characters
- **Example:** `"+14155551234"`
- **Validation:** Must match regex: `/^\+[1-9]\d{1,14}$/`
- **Note:** CONNEXT AI will automatically normalize phone numbers

### `summary` (Optional)
- **Type:** String
- **Max Length:** 10,000 characters
- **Example:** `"Customer called to order 2 pizzas. Total: $28. Order confirmed."`
- **Use Case:** Brief summary of the conversation

### `transcript` (Optional)
- **Type:** String
- **Max Length:** 50,000 characters
- **Example:** Full conversation transcript
- **Use Case:** Complete conversation history

### `recording` (Optional)
- **Type:** String (URL)
- **Format:** Valid HTTP/HTTPS URL
- **Max Length:** 500 characters
- **Example:** `"https://storage.example.com/recordings/call-123.mp3"`
- **Note:** Must be a publicly accessible URL

### `sentiment` (Optional)
- **Type:** String (enum)
- **Allowed Values:** `"positive"` | `"negative"` | `"neutral"`
- **Example:** `"positive"`
- **Use Case:** Overall sentiment of the conversation

### `structured_data` (Optional)
- **Type:** Object (any JSON structure)
- **Default:** `{}` (empty object)
- **Example:**
  ```json
  {
    "customer_name": "John Doe",
    "email": "john@example.com",
    "order_type": "pizza",
    "items": [
      {"name": "Pepperoni Pizza", "quantity": 2, "price": 14.00}
    ],
    "total_price": 28.00,
    "delivery_address": "123 Main St"
  }
  ```
- **Use Case:** Extract structured information from the conversation (names, orders, dates, etc.)

### `duration` (Optional)
- **Type:** Number (integer)
- **Unit:** Seconds
- **Min:** 1
- **Max:** 36,000 (10 hours)
- **Example:** `120` (2 minutes)
- **Note:** Must be a positive integer

---

## ✅ Success Response

If everything is valid, CONNEXT AI will return:

```json
{
  "success": true,
  "lead_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Status Code:** `200 OK`

---

## ❌ Error Responses

### Missing Agent Secret
```json
{
  "error": "Missing x-agent-secret header"
}
```
**Status Code:** `401 Unauthorized`

### Invalid Agent Secret
```json
{
  "error": "Invalid agent secret"
}
```
**Status Code:** `401 Unauthorized`

### Invalid Data Format
```json
{
  "error": "Invalid input data",
  "details": [
    {
      "path": "phone",
      "message": "Phone must be in E.164 format (e.g., +1234567890)"
    }
  ]
}
```
**Status Code:** `400 Bad Request`

### Rate Limit Exceeded
```json
{
  "error": "Rate limit exceeded. Please try again later.",
  "retryAfter": 60
}
```
**Status Code:** `429 Too Many Requests`

---

## 🔧 n8n HTTP Request Node Configuration

Here's how to set up the HTTP Request node in n8n:

### Node Settings:
- **Method:** `POST`
- **URL:** `https://your-domain.com/api/webhooks/ingest`
- **Authentication:** None (we use header)
- **Send Headers:** Yes

### Headers:
```json
{
  "Content-Type": "application/json",
  "x-agent-secret": "{{ $env.AGENT_SECRET }}"
}
```

### Body (JSON):
```json
{
  "phone": "{{ $json.from_number }}",
  "summary": "{{ $json.summary }}",
  "transcript": "{{ $json.transcript }}",
  "recording": "{{ $json.recording_url }}",
  "sentiment": "{{ $json.sentiment }}",
  "structured_data": {{ $json.structured_data }},
  "duration": {{ $json.duration }}
}
```

---

## 📝 Example: Complete n8n Workflow

### Step 1: Webhook Trigger (from Vapi/Retell/Twilio)
- Receives call data when call ends

### Step 2: Extract Data Node
- Extract phone number from `{{ $json.from_number }}`
- Extract transcript from `{{ $json.transcript }}`
- Extract recording URL from `{{ $json.recording_url }}`
- Calculate duration from timestamps
- Analyze sentiment (using AI node if needed)

### Step 3: Structure Data Node
- Build `structured_data` object from conversation
- Example: Extract customer name, order details, etc.

### Step 4: HTTP Request to CONNEXT AI
- POST to `/api/webhooks/ingest`
- Include `x-agent-secret` header
- Send all extracted data

### Step 5: Handle Response
- Check if `success: true`
- Log errors if any
- Optionally send notification

---

## 🎯 Best Practices

1. **Always include `x-agent-secret` header** - Required for authentication
2. **Send data after call ends** - Don't send during conversation
3. **Include phone number** - Helps identify the lead
4. **Extract structured data** - Makes it easier to search/filter in dashboard
5. **Calculate duration** - Helps with analytics
6. **Handle errors** - Add error handling in n8n workflow
7. **Rate limiting** - CONNEXT AI has rate limits (check response headers)

---

## 🧪 Testing

### Test with cURL:
```bash
curl -X POST https://your-domain.com/api/webhooks/ingest \
  -H "Content-Type: application/json" \
  -H "x-agent-secret: YOUR_AGENT_SECRET" \
  -d '{
    "phone": "+14155551234",
    "summary": "Test call",
    "transcript": "This is a test transcript",
    "sentiment": "positive",
    "duration": 60
  }'
```

### Expected Response:
```json
{
  "success": true,
  "lead_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

---

## 📊 What Happens After You Send Data?

1. **CONNEXT AI validates** the data format
2. **CONNEXT AI stores** the lead in the database
3. **Dashboard updates** automatically (via Supabase Realtime)
4. **You can view** the lead in your CONNEXT AI dashboard:
   - See phone number
   - Read transcript
   - Listen to recording
   - View structured data
   - See sentiment analysis

---

## 🆘 Troubleshooting

### "Missing x-agent-secret header"
- Make sure you're including the header in your HTTP Request node
- Check that the header name is exactly `x-agent-secret` (lowercase, with hyphens)

### "Invalid agent secret"
- Verify your agent secret in CONNEXT AI dashboard
- Make sure you're using the correct secret for the correct agent

### "Invalid input data"
- Check the error details in the response
- Verify phone number is in E.164 format (`+1234567890`)
- Check that duration is a positive integer
- Verify recording URL is a valid URL

### "Rate limit exceeded"
- You're sending too many requests too quickly
- Wait for the `retryAfter` seconds before trying again
- Consider batching requests or reducing frequency

---

**That's it! You now know exactly what CONNEXT AI expects from n8n.** 🎉

