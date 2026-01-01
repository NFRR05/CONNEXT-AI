# 🏠 Complete Local Development Setup Guide

## Overview

This guide walks you through setting up **everything locally** for CONNEXT AI development:
- ✅ n8n (Docker)
- ✅ WebSocket Server (Docker)
- ✅ Next.js App (Local)
- ✅ ngrok (for internet access)

**Cost**: FREE (using ngrok free tier)

---

## 📋 Prerequisites

Before starting, make sure you have:

- [ ] **Docker Desktop** installed and running
- [ ] **Node.js 18+** installed
- [ ] **npm** installed
- [ ] **ngrok** account (free): https://ngrok.com/signup
- [ ] **Twilio Account** with phone number
- [ ] **OpenAI API Key**
- [ ] **Supabase Project** set up

---

## 🚀 Step-by-Step Setup

### Step 1: Install Docker Desktop

1. **Download**: https://www.docker.com/products/docker-desktop/
2. **Install** and start Docker Desktop
3. **Verify**:
   ```bash
   docker --version
   docker compose version
   ```

### Step 2: Install ngrok

1. **Sign up**: https://ngrok.com/signup (free account)
2. **Download**: https://ngrok.com/download
3. **Install** ngrok
4. **Get your auth token** from https://dashboard.ngrok.com/get-started/your-authtoken
5. **Configure**:
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```
6. **Verify**:
   ```bash
   ngrok version
   ```

### Step 3: Create Dockerfile.websocket

Create `Dockerfile.websocket` in project root:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source files needed for WebSocket server
COPY server/ ./server/
COPY lib/ ./lib/
COPY types/ ./types/

# Expose port
EXPOSE 8080

# Start server using tsx
CMD ["npx", "tsx", "server/websocket-server.ts"]
```

### Step 4: Update docker-compose.n8n.yml

Add WebSocket server service to your existing `docker-compose.n8n.yml`:

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_ADMIN_USER:-admin}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_ADMIN_PASSWORD}
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=n8n
      - DB_POSTGRESDB_PASSWORD=${N8N_DB_PASSWORD}
      - N8N_API_KEY=${N8N_API_KEY}
      - WEBHOOK_URL=${N8N_WEBHOOK_URL:-http://localhost:5678/}
      - GENERIC_TIMEZONE=UTC
      - N8N_SECURE_COOKIE=${N8N_SECURE_COOKIE:-false}
      - N8N_HOST=${N8N_HOST:-localhost}
      - N8N_PROTOCOL=${N8N_PROTOCOL:-http}
      - N8N_METRICS=true
      - N8N_LOG_LEVEL=info
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - n8n_network

  postgres:
    image: postgres:15-alpine
    container_name: n8n_postgres
    restart: always
    environment:
      - POSTGRES_DB=n8n
      - POSTGRES_USER=n8n
      - POSTGRES_PASSWORD=${N8N_DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - n8n_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U n8n"]
      interval: 10s
      timeout: 5s
      retries: 5

  # WebSocket Server for Twilio Media Streams
  websocket-server:
    build:
      context: .
      dockerfile: Dockerfile.websocket
    container_name: websocket-server
    restart: always
    ports:
      - "8080:8080"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - WS_PORT=8080
      - NODE_ENV=development
    networks:
      - n8n_network

volumes:
  n8n_data:
    driver: local
  postgres_data:
    driver: local

networks:
  n8n_network:
    driver: bridge
```

### Step 5: Generate n8n Keys

Create `.env.n8n` file (if you don't have it):

```bash
# Run the setup script
node scripts/setup-n8n-env.js
```

Or manually generate keys:

```bash
# Generate encryption key
openssl rand -base64 32

# Generate admin password
openssl rand -base64 24

# Generate database password
openssl rand -base64 24
```

Create `.env.n8n`:

```bash
N8N_ADMIN_USER=admin
N8N_ADMIN_PASSWORD=YOUR_GENERATED_PASSWORD
N8N_ENCRYPTION_KEY=YOUR_GENERATED_ENCRYPTION_KEY
N8N_DB_PASSWORD=YOUR_GENERATED_DB_PASSWORD
N8N_API_KEY=SET_AFTER_FIRST_START
N8N_WEBHOOK_URL=http://localhost:5678/
N8N_SECURE_COOKIE=false
N8N_HOST=localhost
N8N_PROTOCOL=http
```

### Step 6: Configure Environment Variables

Update your `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# OpenAI API Key
OPENAI_API_KEY=sk-your-openai-api-key

# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token

# WebSocket Server (will be set after starting ngrok)
TWILIO_WS_SERVER_URL=wss://YOUR_NGROK_URL.ngrok.io
NEXT_PUBLIC_WS_SERVER_URL=wss://YOUR_NGROK_URL.ngrok.io
WS_PORT=8080

# n8n Local Instance
N8N_API_URL=http://localhost:5678
N8N_API_KEY=SET_AFTER_FIRST_START

# Application URL (will be set after starting ngrok for Next.js)
NEXT_PUBLIC_APP_URL=https://YOUR_NEXTJS_NGROK_URL.ngrok.io

# Optional: Vapi.ai (if using Vapi provider)
VAPI_API_KEY=your_vapi_api_key
```

### Step 7: Start Docker Services

```bash
# Load n8n environment variables
# Windows PowerShell:
Get-Content .env.n8n | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
}

# Build and start services
docker-compose -f docker-compose.n8n.yml up -d --build

# Check status
docker-compose -f docker-compose.n8n.yml ps

# View logs
docker-compose -f docker-compose.n8n.yml logs -f
```

### Step 8: Get n8n API Key

1. **Open**: http://localhost:5678
2. **Login**: `admin` / (password from `.env.n8n`)
3. **Go to**: Settings → API
4. **Create API Key**
5. **Copy** the key
6. **Update** `.env.local`:
   ```bash
   N8N_API_KEY=your_api_key_here
   ```

### Step 9: Start ngrok Tunnels

You need **TWO** ngrok tunnels:

#### Terminal 1: WebSocket Server Tunnel
```bash
ngrok http 8080 --scheme=ws
```

**Copy the WebSocket URL** (looks like `wss://abc123.ngrok.io`)

#### Terminal 2: Next.js App Tunnel
```bash
ngrok http 3000
```

**Copy the HTTPS URL** (looks like `https://def456.ngrok.io`)

### Step 10: Update Environment Variables with ngrok URLs

Update `.env.local` with your ngrok URLs:

```bash
# WebSocket Server (from Terminal 1)
TWILIO_WS_SERVER_URL=wss://abc123.ngrok.io
NEXT_PUBLIC_WS_SERVER_URL=wss://abc123.ngrok.io

# Next.js App (from Terminal 2)
NEXT_PUBLIC_APP_URL=https://def456.ngrok.io
```

**⚠️ Important**: Restart your Next.js app after updating these!

### Step 11: Start Next.js App

```bash
npm run dev
```

Your app will be available at:
- **Local**: http://localhost:3000
- **Public** (via ngrok): https://def456.ngrok.io

### Step 12: Configure Twilio Webhooks

1. **Go to**: https://console.twilio.com/
2. **Navigate to**: Phone Numbers → Manage → Active Numbers
3. **Click** on your phone number
4. **Scroll to** "Voice & Fax" section
5. **Set Webhook URLs**:
   - **Voice URL**: `https://YOUR_NEXTJS_NGROK_URL.ngrok.io/api/twilio/voice`
   - **HTTP Method**: POST
   - **Status Callback URL**: `https://YOUR_NEXTJS_NGROK_URL.ngrok.io/api/twilio/status`
   - **Status Callback Method**: POST
6. **Save**

### Step 13: Test Everything

1. **Test n8n**: http://localhost:5678 (should load)
2. **Test WebSocket Server**: 
   ```bash
   # Install wscat
   npm install -g wscat
   
   # Test connection
   wscat -c wss://YOUR_WS_NGROK_URL.ngrok.io/media
   ```
3. **Test Next.js**: http://localhost:3000 (should load)
4. **Test Twilio**: Call your Twilio phone number

---

## 🔄 Daily Workflow

### Starting Everything

```bash
# Terminal 1: Start Docker services
docker-compose -f docker-compose.n8n.yml up -d

# Terminal 2: Start WebSocket ngrok tunnel
ngrok http 8080 --scheme=ws
# Copy the WebSocket URL and update .env.local

# Terminal 3: Start Next.js ngrok tunnel
ngrok http 3000
# Copy the HTTPS URL and update .env.local

# Terminal 4: Start Next.js app
npm run dev
```

### Stopping Everything

```bash
# Stop Docker services
docker-compose -f docker-compose.n8n.yml down

# Stop ngrok (Ctrl+C in each terminal)

# Stop Next.js (Ctrl+C)
```

---

## 🐛 Troubleshooting

### ngrok URL Changed

**Problem**: ngrok free tier gives you a new URL each time you restart.

**Solution**: 
1. Update `.env.local` with new ngrok URLs
2. Restart Next.js app
3. Update Twilio webhooks with new URLs

**Better Solution**: Use ngrok static domain (paid) or use VPS for production.

### WebSocket Not Connecting

**Check**:
1. WebSocket server is running: `docker ps | grep websocket-server`
2. ngrok tunnel is active: Check ngrok dashboard
3. URL is correct: Must be `wss://` (not `ws://`)
4. Environment variables are set correctly

**Test**:
```bash
wscat -c wss://YOUR_NGROK_URL.ngrok.io/media
```

### Twilio Webhook Not Receiving Calls

**Check**:
1. ngrok tunnel is running for Next.js
2. Twilio webhook URL is correct
3. Next.js app is running
4. Check Next.js logs for errors

**Test**:
```bash
# Test webhook endpoint
curl -X POST https://YOUR_NEXTJS_NGROK_URL.ngrok.io/api/twilio/voice \
  -d "CallSid=test123&From=+1234567890&To=+0987654321"
```

### Docker Services Won't Start

**Check**:
1. Docker Desktop is running
2. Ports 5678 and 8080 are not in use
3. Environment variables are set

**Fix**:
```bash
# Check what's using the ports
netstat -ano | findstr :5678
netstat -ano | findstr :8080

# Stop conflicting services or change ports in docker-compose.n8n.yml
```

### n8n Not Accessible

**Check**:
1. Docker container is running: `docker ps`
2. Port 5678 is accessible: `curl http://localhost:5678`
3. Check logs: `docker-compose -f docker-compose.n8n.yml logs n8n`

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Your Local Machine                     │
│                                                           │
│  ┌──────────────┐  ┌─────────────────┐                  │
│  │   n8n        │  │  WebSocket      │                  │
│  │   :5678      │  │  Server :8080   │                  │
│  └──────┬───────┘  └────────┬────────┘                  │
│         │                   │                            │
│  ┌──────▼───────────────────▼────────┐                 │
│  │      PostgreSQL Database           │                 │
│  └────────────────────────────────────┘                 │
│                                                           │
│  ┌────────────────────────────────────┐                  │
│  │      Next.js App :3000             │                  │
│  └────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────┘
         │                          │
         │                          │
    ngrok tunnel              ngrok tunnel
         │                          │
         ↓                          ↓
┌─────────────────┐    ┌──────────────────────┐
│  Internet       │    │  Internet             │
│  (WebSocket)    │    │  (HTTPS Webhooks)    │
└────────┬────────┘    └──────────┬───────────┘
         │                         │
         └──────────┬──────────────┘
                    ↓
            ┌───────────────┐
            │    Twilio     │
            │  (Phone Calls)│
            └───────────────┘
```

---

## ✅ Checklist

Before testing:

- [ ] Docker Desktop is running
- [ ] n8n container is running (`docker ps`)
- [ ] WebSocket server container is running
- [ ] n8n API key is set in `.env.local`
- [ ] ngrok WebSocket tunnel is running (Terminal 1)
- [ ] ngrok Next.js tunnel is running (Terminal 2)
- [ ] `.env.local` has correct ngrok URLs
- [ ] Next.js app is running (`npm run dev`)
- [ ] Twilio webhooks are configured with ngrok URLs
- [ ] All environment variables are set

---

## 💡 Tips

1. **Keep ngrok running**: Don't close the ngrok terminals while developing
2. **Update URLs when ngrok restarts**: Free tier gives new URLs each time
3. **Use ngrok dashboard**: https://dashboard.ngrok.com/status/tunnels to see active tunnels
4. **Check logs**: Use `docker-compose logs -f` to debug issues
5. **Test incrementally**: Test each component separately before testing the full flow

---

## 🎉 You're Ready!

Once everything is running:
- ✅ n8n: http://localhost:5678
- ✅ Next.js: http://localhost:3000
- ✅ WebSocket: wss://YOUR_NGROK_URL.ngrok.io
- ✅ Twilio: Configured with webhooks

**Make a test call** to your Twilio number and watch the magic happen! 🚀

---

## 📝 Quick Reference

### Start Everything
```bash
# 1. Docker
docker-compose -f docker-compose.n8n.yml up -d

# 2. WebSocket ngrok
ngrok http 8080 --scheme=ws

# 3. Next.js ngrok
ngrok http 3000

# 4. Next.js app
npm run dev
```

### Stop Everything
```bash
# Stop Docker
docker-compose -f docker-compose.n8n.yml down

# Stop ngrok (Ctrl+C)
# Stop Next.js (Ctrl+C)
```

### Check Status
```bash
# Docker containers
docker ps

# Docker logs
docker-compose -f docker-compose.n8n.yml logs -f

# ngrok tunnels
# Check: https://dashboard.ngrok.com/status/tunnels
```

---

**Happy coding! 🚀**

