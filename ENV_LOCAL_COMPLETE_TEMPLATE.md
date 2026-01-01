# Complete .env.local Template

## All Environment Variables Needed

Copy this entire template to your `.env.local` file and fill in your values.

```bash
# ============================================
# COMPLETE ENVIRONMENT VARIABLES TEMPLATE
# ============================================

# ============================================
# Supabase Configuration (REQUIRED)
# Get these from: https://app.supabase.com → Project Settings → API
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# OpenAI API Key (REQUIRED)
# Get from: https://platform.openai.com/api-keys
# ============================================
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ============================================
# Twilio Configuration (REQUIRED for Twilio provider)
# Get from: https://console.twilio.com → Account Info
# ============================================
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here

# ============================================
# WebSocket Server Configuration
# Set these AFTER starting ngrok for WebSocket (port 8080)
# Format: wss://YOUR_NGROK_URL.ngrok.io
# ============================================
TWILIO_WS_SERVER_URL=wss://YOUR_NGROK_URL.ngrok.io
NEXT_PUBLIC_WS_SERVER_URL=wss://YOUR_NGROK_URL.ngrok.io
WS_PORT=8080

# ============================================
# Application URL
# Set this AFTER starting ngrok for Next.js (port 3000)
# Format: https://YOUR_NEXTJS_NGROK_URL.ngrok.io
# ============================================
NEXT_PUBLIC_APP_URL=https://YOUR_NEXTJS_NGROK_URL.ngrok.io

# ============================================
# n8n Configuration (REQUIRED)
# N8N_API_KEY: Get from n8n UI after first start
# Go to: http://localhost:5678 → Settings → API → Create API Key
# ============================================
N8N_API_URL=http://localhost:5678
N8N_API_KEY=your_n8n_api_key_from_ui

# ============================================
# n8n Docker Container Configuration
# These are used by docker-compose.n8n.yml
# Generate secure passwords with: openssl rand -base64 24
# Generate encryption key with: openssl rand -base64 32
# ============================================
N8N_ADMIN_USER=admin
N8N_ADMIN_PASSWORD=your_secure_password_here
N8N_ENCRYPTION_KEY=your_encryption_key_here
N8N_DB_PASSWORD=your_database_password_here
N8N_WEBHOOK_URL=http://localhost:5678/
N8N_SECURE_COOKIE=false
N8N_HOST=localhost
N8N_PROTOCOL=http

# ============================================
# Vapi.ai API Key (OPTIONAL - only if using Vapi provider)
# Get from: https://dashboard.vapi.ai/settings
# ============================================
VAPI_API_KEY=your_vapi_api_key
```

## How to Fill This Out

### Step 1: Copy Template
Copy the template above to your `.env.local` file.

### Step 2: Fill in What You Already Have
You mentioned you already have some values. Fill those in first.

### Step 3: Generate n8n Keys (if needed)
If you don't have n8n keys yet, generate them:

```powershell
# Generate encryption key (32 characters)
openssl rand -base64 32

# Generate passwords (24 characters)
openssl rand -base64 24
```

Use these for:
- `N8N_ADMIN_PASSWORD`
- `N8N_ENCRYPTION_KEY`
- `N8N_DB_PASSWORD`

### Step 4: Set ngrok URLs (after starting ngrok)
After you start ngrok tunnels, update:
- `TWILIO_WS_SERVER_URL` (from WebSocket ngrok)
- `NEXT_PUBLIC_WS_SERVER_URL` (same as above)
- `NEXT_PUBLIC_APP_URL` (from Next.js ngrok)

### Step 5: Get n8n API Key (after first Docker start)
1. Start Docker: `docker-compose -f docker-compose.n8n.yml up -d`
2. Open: http://localhost:5678
3. Login with `N8N_ADMIN_USER` and `N8N_ADMIN_PASSWORD`
4. Go to Settings → API → Create API Key
5. Copy and paste into `N8N_API_KEY`

## Variable Categories

### ✅ Required for Next.js App
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WS_SERVER_URL`
- `NEXT_PUBLIC_WS_SERVER_URL`
- `NEXT_PUBLIC_APP_URL`
- `N8N_API_URL`
- `N8N_API_KEY`

### ✅ Required for Docker Compose (n8n + WebSocket)
- `N8N_ADMIN_USER`
- `N8N_ADMIN_PASSWORD`
- `N8N_ENCRYPTION_KEY`
- `N8N_DB_PASSWORD`
- `OPENAI_API_KEY` (for WebSocket server)
- `NEXT_PUBLIC_SUPABASE_URL` (for WebSocket server)
- `SUPABASE_SERVICE_ROLE_KEY` (for WebSocket server)

### ⚠️ Optional
- `VAPI_API_KEY` (only if using Vapi provider)

## Quick Start Script

After filling in `.env.local`, you can load it before starting Docker:

```powershell
# Load all variables from .env.local
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process')
    }
}

# Start Docker (will use loaded variables)
docker-compose -f docker-compose.n8n.yml up -d --build
```

