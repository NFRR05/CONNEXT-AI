# 🚀 Complete Deployment Guide: Twilio + n8n + WebSocket on VPS

## Overview

This guide covers deploying **n8n** and **WebSocket Server** together using Docker Compose on a VPS (Virtual Private Server). This setup is cost-effective (~$6-12/month) and gives you full control.

---

## 📋 Prerequisites

- VPS with Ubuntu 22.04 (DigitalOcean, Linode, Vultr, etc.)
- Domain name (optional but recommended)
- SSH access to your VPS
- Basic terminal knowledge

---

## 🎯 Architecture

```
┌─────────────────────────────────────────┐
│           Your VPS Server                │
│                                          │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │   n8n        │  │  WebSocket      │ │
│  │   (Port 5678)│  │  Server         │ │
│  │              │  │  (Port 8080)    │ │
│  └──────┬───────┘  └────────┬────────┘ │
│         │                   │           │
│  ┌──────▼───────────────────▼─────────┐ │
│  │      PostgreSQL Database           │ │
│  │      (Internal Docker Network)     │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │      Nginx Reverse Proxy            │ │
│  │      (Routes traffic to services)   │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 📦 Step 1: Prepare Your Local Files

### 1.0 Environment Variables Security Check

**✅ Your environment files are SAFE:**
- `.env.local` is in `.gitignore` ✅
- `.env.n8n` is in `.gitignore` ✅
- No secrets will be committed to git ✅

**See `ENVIRONMENT_VARIABLES_CHECKLIST.md` for complete security analysis and missing values.**

### 1.1 Update docker-compose.n8n.yml

Add the WebSocket server service to your existing `docker-compose.n8n.yml`:

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
      - WEBHOOK_URL=${N8N_WEBHOOK_URL:-https://n8n.your-domain.com}
      - GENERIC_TIMEZONE=UTC
      - N8N_SECURE_COOKIE=${N8N_SECURE_COOKIE:-true}
      - N8N_HOST=${N8N_HOST:-0.0.0.0}
      - N8N_PROTOCOL=${N8N_PROTOCOL:-https}
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
      - NODE_ENV=production
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

### 1.2 Create Dockerfile.websocket

Create `Dockerfile.websocket` in your project root:

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

### 1.3 Create Production Environment File

Create `.env.production` (for VPS deployment):

```bash
# ============================================
# n8n Configuration
# ============================================
N8N_ADMIN_USER=admin
N8N_ADMIN_PASSWORD=CHANGE_THIS_TO_SECURE_PASSWORD
N8N_ENCRYPTION_KEY=CHANGE_THIS_GENERATE_WITH_openssl_rand_-base64_32
N8N_DB_PASSWORD=CHANGE_THIS_TO_SECURE_PASSWORD
N8N_API_KEY=CHANGE_THIS_GET_FROM_N8N_UI_AFTER_DEPLOYMENT
N8N_WEBHOOK_URL=https://n8n.your-domain.com
N8N_SECURE_COOKIE=true
N8N_HOST=0.0.0.0
N8N_PROTOCOL=https

# ============================================
# WebSocket Server Configuration
# ============================================
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
WS_PORT=8080

# ============================================
# Domain Configuration
# ============================================
DOMAIN=your-domain.com
```

**⚠️ SECURITY NOTE:** Never commit `.env.production` to git! It's already in `.gitignore`.

---

## 🖥️ Step 2: Set Up Your VPS

### 2.1 Create VPS Instance

**Recommended Providers:**
- **DigitalOcean**: $6/month (1GB RAM) or $12/month (2GB RAM)
- **Linode**: $5/month (1GB RAM)
- **Vultr**: $6/month (1GB RAM)

**Steps:**
1. Sign up at your chosen provider
2. Create a new Droplet/Instance
3. Choose: **Ubuntu 22.04 LTS**
4. Select size: **1GB RAM minimum** (2GB recommended)
5. Choose a region close to you
6. Add your SSH key (recommended) or set root password
7. Create the instance

### 2.2 Connect to Your VPS

```bash
# If using SSH key
ssh root@your_server_ip

# If using password
ssh root@your_server_ip
# Enter password when prompted
```

### 2.3 Initial Server Setup

```bash
# Update system
apt update && apt upgrade -y

# Install essential tools
apt install -y curl wget git nano ufw

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install -y docker-compose-plugin

# Verify installation
docker --version
docker compose version

# Add your user to docker group (if not root)
# usermod -aG docker $USER
```

### 2.4 Configure Firewall

```bash
# Allow SSH
ufw allow 22/tcp

# Allow HTTP and HTTPS (for Nginx)
ufw allow 80/tcp
ufw allow 443/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

---

## 📤 Step 3: Upload Files to VPS

### Option A: Using Git (Recommended)

```bash
# On your VPS
cd /opt
git clone https://github.com/your-username/connext-ai.git
cd connext-ai

# Or if private repo, use SSH key
```

### Option B: Using SCP

```bash
# From your local machine
scp -r . root@your_server_ip:/opt/connext-ai/

# Or specific files
scp docker-compose.n8n.yml Dockerfile.websocket .env.production root@your_server_ip:/opt/connext-ai/
```

### Option C: Manual Upload

1. Use SFTP client (FileZilla, WinSCP)
2. Connect to your VPS
3. Upload files to `/opt/connext-ai/`

---

## 🔐 Step 4: Configure Environment Variables

### 4.1 Generate Required Keys

```bash
# On your VPS or local machine

# Generate n8n encryption key
openssl rand -base64 32

# Generate secure passwords
openssl rand -base64 24
```

### 4.2 Edit .env.production

```bash
# On your VPS
cd /opt/connext-ai
nano .env.production
```

**Fill in all values:**

```bash
# n8n Admin
N8N_ADMIN_USER=admin
N8N_ADMIN_PASSWORD=YOUR_SECURE_PASSWORD_HERE

# n8n Encryption Key (generate with: openssl rand -base64 32)
N8N_ENCRYPTION_KEY=YOUR_ENCRYPTION_KEY_HERE

# Database Password
N8N_DB_PASSWORD=YOUR_DB_PASSWORD_HERE

# n8n API Key (will be set after first deployment)
N8N_API_KEY=SET_AFTER_DEPLOYMENT

# n8n Webhook URL (update with your domain)
N8N_WEBHOOK_URL=https://n8n.your-domain.com

# WebSocket Server
OPENAI_API_KEY=sk-your-openai-key-here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
WS_PORT=8080

# Domain
DOMAIN=your-domain.com
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

---

## 🚀 Step 5: Deploy Services

### 5.1 Build and Start Services

```bash
cd /opt/connext-ai

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

# Build WebSocket server image
docker compose -f docker-compose.n8n.yml build websocket-server

# Start all services
docker compose -f docker-compose.n8n.yml up -d

# Check status
docker compose -f docker-compose.n8n.yml ps

# View logs
docker compose -f docker-compose.n8n.yml logs -f
```

### 5.2 Verify Services Are Running

```bash
# Check containers
docker ps

# Should see:
# - n8n
# - n8n_postgres
# - websocket-server

# Test n8n (should respond)
curl http://localhost:5678

# Test WebSocket server (should show connection info)
curl http://localhost:8080
```

---

## 🌐 Step 6: Set Up Domain & SSL

### 6.1 Point Domain to VPS

1. Go to your domain registrar
2. Add DNS records:
   ```
   Type: A
   Name: n8n
   Value: YOUR_VPS_IP
   
   Type: A
   Name: ws
   Value: YOUR_VPS_IP
   ```
3. Wait for DNS propagation (5-60 minutes)

### 6.2 Install Nginx

```bash
# Install Nginx
apt install -y nginx certbot python3-certbot-nginx

# Start Nginx
systemctl start nginx
systemctl enable nginx
```

### 6.3 Configure Nginx for n8n

```bash
# Create n8n config
nano /etc/nginx/sites-available/n8n
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name n8n.your-domain.com;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6.4 Configure Nginx for WebSocket Server

```bash
# Create WebSocket config
nano /etc/nginx/sites-available/websocket
```

Add this configuration:

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 80;
    server_name ws.your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket specific settings
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
```

### 6.5 Enable Sites

```bash
# Enable n8n
ln -s /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/

# Enable WebSocket
ln -s /etc/nginx/sites-available/websocket /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

### 6.6 Get SSL Certificates

```bash
# Get SSL for n8n
certbot --nginx -d n8n.your-domain.com

# Get SSL for WebSocket
certbot --nginx -d ws.your-domain.com

# Auto-renewal is set up automatically
```

### 6.7 Update Environment Variables

```bash
# Update .env.production
nano /opt/connext-ai/.env.production

# Change:
N8N_WEBHOOK_URL=https://n8n.your-domain.com
N8N_PROTOCOL=https
N8N_SECURE_COOKIE=true

# Restart services
cd /opt/connext-ai
docker compose -f docker-compose.n8n.yml restart n8n
```

---

## 🔑 Step 7: Get n8n API Key

### 7.1 Access n8n

1. Visit: `https://n8n.your-domain.com`
2. Log in with:
   - Username: `admin` (or your `N8N_ADMIN_USER`)
   - Password: Your `N8N_ADMIN_PASSWORD`

### 7.2 Create API Key

1. Click **Settings** (gear icon)
2. Go to **API**
3. Click **Create API Key**
4. Copy the API key

### 7.3 Update Environment Variable

```bash
# Edit .env.production
nano /opt/connext-ai/.env.production

# Update N8N_API_KEY
N8N_API_KEY=your_api_key_here

# Restart n8n
docker compose -f docker-compose.n8n.yml restart n8n
```

---

## 🔗 Step 8: Update Next.js App Environment Variables

In your Next.js deployment (Vercel/Railway), add:

```bash
# n8n
N8N_API_URL=https://n8n.your-domain.com
N8N_API_KEY=your_n8n_api_key

# WebSocket Server
TWILIO_WS_SERVER_URL=wss://ws.your-domain.com
NEXT_PUBLIC_WS_SERVER_URL=wss://ws.your-domain.com

# Other variables (already set)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
OPENAI_API_KEY=your_openai_api_key
# ... etc
```

---

## ✅ Step 9: Verify Everything Works

### 9.1 Test n8n

```bash
# Check n8n is accessible
curl https://n8n.your-domain.com

# Should return HTML
```

### 9.2 Test WebSocket Server

```bash
# Install wscat (on your local machine)
npm install -g wscat

# Test connection
wscat -c wss://ws.your-domain.com/media

# Should connect (may show error about missing params, that's OK)
```

### 9.3 Test Full Flow

1. Create a Twilio agent via your Next.js API
2. Call your Twilio phone number
3. Check logs:
   ```bash
   docker compose -f docker-compose.n8n.yml logs -f websocket-server
   ```
4. Should see connection logs

---

## 🛠️ Maintenance Commands

### View Logs

```bash
# All services
docker compose -f docker-compose.n8n.yml logs -f

# Specific service
docker compose -f docker-compose.n8n.yml logs -f n8n
docker compose -f docker-compose.n8n.yml logs -f websocket-server
docker compose -f docker-compose.n8n.yml logs -f postgres
```

### Restart Services

```bash
# Restart all
docker compose -f docker-compose.n8n.yml restart

# Restart specific service
docker compose -f docker-compose.n8n.yml restart websocket-server
docker compose -f docker-compose.n8n.yml restart n8n
```

### Stop Services

```bash
docker compose -f docker-compose.n8n.yml down
```

### Start Services

```bash
docker compose -f docker-compose.n8n.yml up -d
```

### Update Services

```bash
# Pull latest images
docker compose -f docker-compose.n8n.yml pull

# Rebuild WebSocket server (after code changes)
docker compose -f docker-compose.n8n.yml build websocket-server

# Restart
docker compose -f docker-compose.n8n.yml up -d
```

### Backup Database

```bash
# Create backup
docker exec n8n_postgres pg_dump -U n8n n8n > backup_$(date +%Y%m%d).sql

# Restore backup
docker exec -i n8n_postgres psql -U n8n n8n < backup_20240101.sql
```

---

## 🔒 Security Checklist

- [ ] Changed default passwords
- [ ] Generated strong encryption keys
- [ ] SSL certificates installed
- [ ] Firewall configured (only ports 22, 80, 443 open)
- [ ] Environment variables not committed to git
- [ ] n8n basic auth enabled
- [ ] Regular backups configured
- [ ] SSH key authentication (not password)
- [ ] Fail2ban installed (optional but recommended)

### Install Fail2ban (Optional)

```bash
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

---

## 📊 Monitoring

### Check Resource Usage

```bash
# CPU and memory
docker stats

# Disk space
df -h

# Docker disk usage
docker system df
```

### Set Up Monitoring (Optional)

Consider using:
- **UptimeRobot**: Free uptime monitoring
- **Grafana + Prometheus**: Advanced monitoring
- **Docker health checks**: Already configured

---

## 🐛 Troubleshooting

### Services Won't Start

```bash
# Check logs
docker compose -f docker-compose.n8n.yml logs

# Check if ports are in use
netstat -tulpn | grep -E '5678|8080'

# Check Docker
docker ps -a
```

### WebSocket Not Connecting

1. Check WebSocket server logs:
   ```bash
   docker compose -f docker-compose.n8n.yml logs websocket-server
   ```

2. Verify environment variables:
   ```bash
   docker exec websocket-server env | grep -E 'OPENAI|SUPABASE'
   ```

3. Test connection locally:
   ```bash
   wscat -c wss://ws.your-domain.com/media
   ```

### n8n Not Accessible

1. Check n8n logs:
   ```bash
   docker compose -f docker-compose.n8n.yml logs n8n
   ```

2. Check Nginx:
   ```bash
   nginx -t
   systemctl status nginx
   ```

3. Check firewall:
   ```bash
   ufw status
   ```

### Database Issues

```bash
# Check postgres logs
docker compose -f docker-compose.n8n.yml logs postgres

# Check database connection
docker exec -it n8n_postgres psql -U n8n -d n8n
```

---

## 💰 Cost Breakdown

- **VPS**: $6-12/month (DigitalOcean/Linode)
- **Domain**: $12/year (~$1/month)
- **Total**: ~$7-13/month

**vs. Separate Hosting:**
- n8n Cloud: $20/month
- Railway WebSocket: $5/month
- **Total**: $25/month

**Savings**: ~$12-18/month (50-70% cheaper!)

---

## 📝 Quick Reference

### File Locations

- Docker Compose: `/opt/connext-ai/docker-compose.n8n.yml`
- Environment: `/opt/connext-ai/.env.production`
- Nginx Config: `/etc/nginx/sites-available/`
- Logs: `docker compose logs`

### Important URLs

- n8n: `https://n8n.your-domain.com`
- WebSocket: `wss://ws.your-domain.com`
- Next.js App: `https://your-nextjs-app.com`

### Environment Variables Needed

See the **Environment Variables Checklist** section below.

---

## ✅ Deployment Checklist

- [ ] VPS created and accessible
- [ ] Docker and Docker Compose installed
- [ ] Files uploaded to VPS
- [ ] `.env.production` configured with all values
- [ ] Services built and started
- [ ] Domain DNS configured
- [ ] Nginx installed and configured
- [ ] SSL certificates obtained
- [ ] n8n API key created and added to env
- [ ] Next.js app environment variables updated
- [ ] All services tested and working
- [ ] Backups configured
- [ ] Monitoring set up

---

## 🎉 You're Done!

Your setup is now complete:
- ✅ n8n running on `https://n8n.your-domain.com`
- ✅ WebSocket server on `wss://ws.your-domain.com`
- ✅ Both services in Docker
- ✅ SSL certificates active
- ✅ Ready for production use

**Next Steps:**
1. Test creating a Twilio agent
2. Make a test call
3. Monitor logs for any issues
4. Set up regular backups

---

## 📞 Support

If you encounter issues:
1. Check logs: `docker compose logs -f`
2. Verify environment variables
3. Check Nginx configuration
4. Review firewall settings
5. Test each service individually

**Happy deploying! 🚀**

