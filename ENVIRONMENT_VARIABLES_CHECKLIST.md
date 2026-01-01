# 🔐 Environment Variables Security & Checklist

## Security Status

### ✅ SAFE (Already in .gitignore)

Your `.gitignore` correctly excludes:
- `.env*.local` ✅
- `.env` ✅
- `.env.n8n` ✅

**These files will NOT be committed to git** - this is correct!

---

## 📋 Complete Environment Variables Checklist

### For Next.js App (Vercel/Railway/Render)

#### ✅ Required for Basic Functionality

```bash
# ============================================
# Supabase (REQUIRED)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# ============================================
# OpenAI (REQUIRED)
# ============================================
OPENAI_API_KEY=sk-your-openai-api-key

# ============================================
# Application URL (REQUIRED)
# ============================================
NEXT_PUBLIC_APP_URL=https://your-nextjs-app.com
```

#### ✅ Required for Twilio Provider

```bash
# ============================================
# Twilio (REQUIRED for Twilio agents)
# ============================================
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token

# ============================================
# WebSocket Server (REQUIRED for Twilio)
# ============================================
TWILIO_WS_SERVER_URL=wss://ws.your-domain.com
NEXT_PUBLIC_WS_SERVER_URL=wss://ws.your-domain.com
```

#### ✅ Required for n8n Integration

```bash
# ============================================
# n8n (REQUIRED for workflow automation)
# ============================================
N8N_API_URL=https://n8n.your-domain.com
N8N_API_KEY=your_n8n_api_key_from_ui
```

#### ⚠️ Optional (for Vapi provider - not needed if using Twilio)

```bash
# ============================================
# Vapi.ai (OPTIONAL - only if using Vapi)
# ============================================
VAPI_API_KEY=your_vapi_api_key
```

---

### For VPS Docker Compose (.env.production)

#### ✅ Required for n8n Service

```bash
# ============================================
# n8n Configuration
# ============================================
N8N_ADMIN_USER=admin
N8N_ADMIN_PASSWORD=CHANGE_THIS_SECURE_PASSWORD
N8N_ENCRYPTION_KEY=CHANGE_THIS_GENERATE_WITH_openssl_rand_-base64_32
N8N_DB_PASSWORD=CHANGE_THIS_SECURE_PASSWORD
N8N_API_KEY=SET_AFTER_FIRST_DEPLOYMENT
N8N_WEBHOOK_URL=https://n8n.your-domain.com
N8N_SECURE_COOKIE=true
N8N_HOST=0.0.0.0
N8N_PROTOCOL=https
```

#### ✅ Required for WebSocket Server

```bash
# ============================================
# WebSocket Server Configuration
# ============================================
OPENAI_API_KEY=sk-your-openai-api-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
WS_PORT=8080
NODE_ENV=production
```

#### ✅ Optional (for reference)

```bash
# ============================================
# Domain Configuration
# ============================================
DOMAIN=your-domain.com
```

---

## 🔍 Missing Values Analysis

### For Next.js App Deployment

**Currently in `env.example`:**
- ✅ Supabase (3 variables)
- ✅ Twilio (2 variables)
- ✅ WebSocket URLs (2 variables)
- ✅ OpenAI (1 variable)
- ✅ App URL (1 variable)
- ✅ n8n (2 variables)
- ⚠️ Vapi (1 variable - optional)

**Missing for Production:**
- ❌ None! All required variables are documented

**But check these are SET (not just placeholders):**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Real Supabase URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Real service role key
- [ ] `OPENAI_API_KEY` - Real OpenAI key
- [ ] `TWILIO_ACCOUNT_SID` - Real Twilio SID
- [ ] `TWILIO_AUTH_TOKEN` - Real Twilio token
- [ ] `TWILIO_WS_SERVER_URL` - Real WebSocket URL (after VPS deployment)
- [ ] `NEXT_PUBLIC_WS_SERVER_URL` - Same as above
- [ ] `N8N_API_URL` - Real n8n URL (after VPS deployment)
- [ ] `N8N_API_KEY` - Real n8n API key (after first deployment)
- [ ] `NEXT_PUBLIC_APP_URL` - Your production Next.js URL

### For VPS Docker Compose

**Missing from `env.example` (but needed for VPS):**
- ❌ `N8N_ADMIN_USER` - n8n admin username
- ❌ `N8N_ADMIN_PASSWORD` - n8n admin password
- ❌ `N8N_ENCRYPTION_KEY` - n8n encryption key
- ❌ `N8N_DB_PASSWORD` - PostgreSQL password
- ❌ `N8N_API_KEY` - n8n API key (set after deployment)
- ❌ `N8N_WEBHOOK_URL` - n8n webhook URL
- ❌ `N8N_SECURE_COOKIE` - Cookie security setting
- ❌ `N8N_HOST` - n8n host binding
- ❌ `N8N_PROTOCOL` - HTTP/HTTPS protocol
- ❌ `DOMAIN` - Your domain name

**These are in the deployment guide but not in env.example** - this is OK because they're VPS-specific.

---

## 🔒 Security Recommendations

### 1. Password Strength

**Generate strong passwords:**
```bash
# Generate secure password (24 characters)
openssl rand -base64 24

# Generate encryption key (32 characters)
openssl rand -base64 32
```

**Use for:**
- `N8N_ADMIN_PASSWORD`
- `N8N_DB_PASSWORD`
- `N8N_ENCRYPTION_KEY`

### 2. API Keys

**Never:**
- ❌ Commit API keys to git
- ❌ Share API keys in screenshots
- ❌ Use the same keys for dev/prod
- ❌ Store keys in code comments

**Always:**
- ✅ Use environment variables
- ✅ Rotate keys regularly
- ✅ Use different keys for dev/prod
- ✅ Restrict API key permissions

### 3. Service Role Keys

**Supabase Service Role Key:**
- ⚠️ **VERY SENSITIVE** - bypasses RLS
- ✅ Only use in server-side code
- ✅ Never expose to client
- ✅ Rotate if exposed

### 4. Environment File Management

**Local Development:**
- Use `.env.local` (already in .gitignore) ✅

**Production VPS:**
- Use `.env.production` (add to .gitignore if not already)
- Set file permissions: `chmod 600 .env.production`
- Only readable by owner

**Next.js Deployment (Vercel/Railway):**
- Use platform's environment variable settings
- Mark sensitive variables as "Secret"
- Never commit to git

---

## ✅ Pre-Deployment Checklist

### Next.js App Environment Variables

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Set to production Supabase URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Set to production anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Set to production service role key
- [ ] `OPENAI_API_KEY` - Set to real OpenAI API key
- [ ] `TWILIO_ACCOUNT_SID` - Set to real Twilio Account SID
- [ ] `TWILIO_AUTH_TOKEN` - Set to real Twilio Auth Token
- [ ] `TWILIO_WS_SERVER_URL` - Set to `wss://ws.your-domain.com` (after VPS setup)
- [ ] `NEXT_PUBLIC_WS_SERVER_URL` - Same as above
- [ ] `N8N_API_URL` - Set to `https://n8n.your-domain.com` (after VPS setup)
- [ ] `N8N_API_KEY` - Set after first n8n deployment
- [ ] `NEXT_PUBLIC_APP_URL` - Set to your production Next.js URL
- [ ] `VAPI_API_KEY` - Optional, only if using Vapi provider

### VPS Docker Compose Environment Variables

- [ ] `N8N_ADMIN_USER` - Set to desired admin username
- [ ] `N8N_ADMIN_PASSWORD` - Generated secure password
- [ ] `N8N_ENCRYPTION_KEY` - Generated with `openssl rand -base64 32`
- [ ] `N8N_DB_PASSWORD` - Generated secure password
- [ ] `N8N_API_KEY` - Will be set after first deployment
- [ ] `N8N_WEBHOOK_URL` - Set to `https://n8n.your-domain.com`
- [ ] `N8N_SECURE_COOKIE` - Set to `true` for production
- [ ] `N8N_HOST` - Set to `0.0.0.0`
- [ ] `N8N_PROTOCOL` - Set to `https` for production
- [ ] `OPENAI_API_KEY` - Set to real OpenAI API key
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Set to production Supabase URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Set to production service role key
- [ ] `WS_PORT` - Set to `8080`
- [ ] `NODE_ENV` - Set to `production`
- [ ] `DOMAIN` - Set to your domain name

---

## 🚨 Critical Security Issues to Fix

### 1. Check for Exposed Keys

**Search your codebase for:**
```bash
# Look for hardcoded keys
grep -r "sk-" .
grep -r "AC" .
grep -r "eyJ" .
```

**If found:**
- ❌ Remove immediately
- ✅ Rotate the exposed key
- ✅ Use environment variables instead

### 2. Verify .gitignore

**Check `.gitignore` includes:**
```
.env*.local
.env
.env.n8n
.env.production
```

**If not, add them!**

### 3. Check Git History

**If you accidentally committed secrets:**
```bash
# Remove from git history (DANGEROUS - be careful!)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all
```

**Better: Rotate all exposed keys immediately!**

---

## 📝 Environment Variables Template

### For Next.js (.env.local or Platform Settings)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# WebSocket Server (after VPS deployment)
TWILIO_WS_SERVER_URL=wss://ws.your-domain.com
NEXT_PUBLIC_WS_SERVER_URL=wss://ws.your-domain.com

# n8n (after VPS deployment)
N8N_API_URL=https://n8n.your-domain.com
N8N_API_KEY=n8n_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# App URL
NEXT_PUBLIC_APP_URL=https://your-nextjs-app.vercel.app

# Optional: Vapi (only if using Vapi provider)
VAPI_API_KEY=your_vapi_key_here
```

### For VPS Docker Compose (.env.production)

```bash
# n8n Admin
N8N_ADMIN_USER=admin
N8N_ADMIN_PASSWORD=CHANGE_THIS_USE_openssl_rand_-base64_24

# n8n Encryption
N8N_ENCRYPTION_KEY=CHANGE_THIS_USE_openssl_rand_-base64_32

# Database
N8N_DB_PASSWORD=CHANGE_THIS_USE_openssl_rand_-base64_24

# n8n API (set after first deployment)
N8N_API_KEY=SET_AFTER_DEPLOYMENT

# n8n Configuration
N8N_WEBHOOK_URL=https://n8n.your-domain.com
N8N_SECURE_COOKIE=true
N8N_HOST=0.0.0.0
N8N_PROTOCOL=https

# WebSocket Server
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
WS_PORT=8080
NODE_ENV=production

# Domain
DOMAIN=your-domain.com
```

---

## ✅ Final Security Checklist

Before deploying:

- [ ] All `.env*` files are in `.gitignore`
- [ ] No hardcoded secrets in code
- [ ] All passwords are strong (24+ characters)
- [ ] Encryption keys generated with `openssl rand -base64 32`
- [ ] Different keys for dev/prod
- [ ] Service role keys only in server-side code
- [ ] API keys have minimal required permissions
- [ ] File permissions set correctly (`chmod 600 .env.production`)
- [ ] All required variables are set (not placeholders)
- [ ] Production URLs use HTTPS
- [ ] n8n secure cookies enabled
- [ ] Firewall configured on VPS
- [ ] SSL certificates installed

---

## 🎯 Summary

### ✅ What's Safe
- `.env.local` is in `.gitignore` ✅
- `.env.n8n` is in `.gitignore` ✅
- Environment variables are used correctly ✅

### ⚠️ What to Check
- All values are real (not placeholders)
- Strong passwords generated
- Production URLs are correct
- Keys are rotated if exposed

### ❌ What's Missing
- VPS-specific variables (documented in deployment guide)
- Need to generate: `N8N_ENCRYPTION_KEY`, `N8N_ADMIN_PASSWORD`, `N8N_DB_PASSWORD`
- Need to set after deployment: `N8N_API_KEY`, production URLs

**You're good to go! Just make sure to:**
1. Generate secure passwords
2. Set all production URLs after VPS deployment
3. Get n8n API key after first deployment
4. Never commit `.env` files

