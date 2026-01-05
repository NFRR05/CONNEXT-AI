# n8n Backend New Flow Documentation

This folder contains documentation for the new architecture where **n8n is the backend** and **CONNEXT AI is the dashboard**.

## 📁 Files in This Folder

### 1. `AGENT-CREATION-GUIDE.md`
Complete step-by-step guide to create your first AI agent using n8n + voice providers + CONNEXT AI.

**What it covers:**
- Architecture overview
- Setting up agents in CONNEXT AI
- Configuring voice providers (Twilio/Retell/Vapi)
- Building n8n workflows
- Testing your setup

### 2. `N8N-TO-CONNEXT-AI-INTEGRATION.md`
Complete technical specification of what data CONNEXT AI expects from n8n.

**What it covers:**
- Exact endpoint details
- Authentication requirements
- Complete data format specification
- Field-by-field documentation
- Error responses
- n8n configuration examples
- Testing instructions

## 🏗️ Architecture

```
Voice Provider (Twilio/Retell/Vapi)
    ↓ (webhooks)
n8n Workflow (Backend - AI Logic)
    ↓ (POST data)
CONNEXT AI (Dashboard - Display Data)
```

## 🚀 Quick Start

1. Read `AGENT-CREATION-GUIDE.md` to understand the flow
2. Read `N8N-TO-CONNEXT-AI-INTEGRATION.md` for technical details
3. Build your n8n workflow
4. Send data to CONNEXT AI
5. View results in dashboard

## 📝 Key Concepts

- **n8n = Backend**: All conversation logic, AI processing, data extraction happens in n8n
- **CONNEXT AI = Dashboard**: Only receives final data and displays it
- **Voice Provider → n8n**: Webhooks go directly to n8n (not CONNEXT AI)
- **n8n → CONNEXT AI**: After processing, n8n sends structured data to CONNEXT AI

## 🔗 Related Documentation

- Main project README: `../README.md`
- n8n Setup Guide: `../N8N_SETUP_GUIDE.md`
- Environment Variables: `../ENVIRONMENT_VARIABLES_CHECKLIST.md`

---

**Start with `AGENT-CREATION-GUIDE.md` to get started!** 🎯

