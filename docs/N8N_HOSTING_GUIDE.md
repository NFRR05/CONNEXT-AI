# n8n Hosting Guide

This guide explains how to host n8n on your server for Pro tier customers.

## Prerequisites

- A server (VPS, cloud instance, or dedicated server)
- Docker installed (recommended) OR Node.js 18+ installed
- Domain name (optional but recommended)
- SSL certificate (for HTTPS - Let's Encrypt is free)

---

## Option 1: Docker (Recommended - Easiest)

### Step 1: Install Docker

**On Ubuntu/Debian:**
```bash
# Update package index
sudo apt update

# Install Docker
sudo apt install docker.io docker-compose -y

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (optional, to run without sudo)
sudo usermod -aG docker $USER
```

**On CentOS/RHEL:**
```bash
sudo yum install docker docker-compose -y
sudo systemctl start docker
sudo systemctl enable docker
```

### Step 2: Create Docker Compose File

Create a file `docker-compose.yml`:

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
      # Basic Configuration
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=your_secure_password_here
      
      # Encryption Key (generate a random string)
      - N8N_ENCRYPTION_KEY=your_encryption_key_here
      
      # Database (using SQLite by default, or PostgreSQL for production)
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=n8n
      - DB_POSTGRESDB_PASSWORD=your_db_password
      
      # API Configuration
      - N8N_API_KEY=your_api_key_here
      
      # Webhook URL (your domain)
      - WEBHOOK_URL=https://your-domain.com/
      
      # Timezone
      - GENERIC_TIMEZONE=UTC
      
      # Security
      - N8N_SECURE_COOKIE=true
      - N8N_HOST=your-domain.com
      - N8N_PROTOCOL=https
      
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    container_name: n8n_postgres
    restart: always
    environment:
      - POSTGRES_DB=n8n
      - POSTGRES_USER=n8n
      - POSTGRES_PASSWORD=your_db_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  n8n_data:
  postgres_data:
```

### Step 3: Generate Secure Keys

```bash
# Generate encryption key (32+ characters)
openssl rand -base64 32

# Generate API key (32+ characters)
openssl rand -base64 32

# Generate database password
openssl rand -base64 24
```

### Step 4: Update docker-compose.yml

Replace these values in `docker-compose.yml`:
- `N8N_BASIC_AUTH_PASSWORD`: Your admin password
- `N8N_ENCRYPTION_KEY`: Generated encryption key
- `N8N_API_KEY`: Generated API key (this goes in your .env file)
- `DB_POSTGRESDB_PASSWORD`: Generated database password
- `POSTGRES_PASSWORD`: Same as above
- `WEBHOOK_URL`: Your domain (e.g., `https://n8n.yourdomain.com`)
- `N8N_HOST`: Your domain

### Step 5: Start n8n

```bash
# Start n8n
docker-compose up -d

# Check logs
docker-compose logs -f n8n

# Check if it's running
docker ps
```

### Step 6: Access n8n

- Open browser: `http://your-server-ip:5678` (or your domain)
- Login with: `admin` / `your_secure_password_here`

---

## Option 2: npm Installation (Alternative)

### Step 1: Install Node.js 18+

```bash
# Using Node Version Manager (nvm) - recommended
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

### Step 2: Install n8n

```bash
# Install n8n globally
npm install -g n8n

# Or install locally
npm install n8n
```

### Step 3: Set Environment Variables

Create `.env` file:

```bash
# Basic Auth
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your_secure_password

# Encryption
N8N_ENCRYPTION_KEY=your_encryption_key

# API Key
N8N_API_KEY=your_api_key

# Database (PostgreSQL)
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=localhost
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=n8n
DB_POSTGRESDB_PASSWORD=your_db_password

# Webhook URL
WEBHOOK_URL=https://your-domain.com/

# Security
N8N_SECURE_COOKIE=true
N8N_HOST=your-domain.com
N8N_PROTOCOL=https
```

### Step 4: Start n8n

```bash
# Run n8n
n8n start

# Or with PM2 (for production)
npm install -g pm2
pm2 start n8n --name n8n
pm2 save
pm2 startup
```

---

## Option 3: Cloud Services (Easiest but Paid)

### n8n Cloud
- Go to [n8n.io](https://n8n.io)
- Sign up for n8n Cloud
- Get your API key from settings
- Use their API URL

### Railway/Render/Fly.io
- Deploy n8n using their Docker templates
- Set environment variables
- Get your API URL

---

## Configuration for CONNEXT AI

### Step 1: Get n8n API Key

1. Login to n8n
2. Go to **Settings** → **API**
3. Click **Create API Key**
4. Copy the key

### Step 2: Update Your Environment Variables

Add to your `.env.local` (or Vercel environment variables):

```bash
# n8n Hosted Instance (for Pro tier customers)
N8N_API_URL=https://your-n8n-domain.com
N8N_API_KEY=your_n8n_api_key_here
```

### Step 3: Test Connection

You can test if n8n API is accessible:

```bash
curl -X GET "https://your-n8n-domain.com/api/v1/workflows" \
  -H "X-N8N-API-KEY: your_api_key"
```

---

## Security Best Practices

### 1. Use HTTPS

**With Nginx Reverse Proxy:**

```nginx
server {
    listen 80;
    server_name n8n.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name n8n.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/n8n.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/n8n.yourdomain.com/privkey.pem;

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

**Get SSL Certificate (Let's Encrypt):**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d n8n.yourdomain.com
```

### 2. Firewall Configuration

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Block direct access to n8n port (only through reverse proxy)
# Don't expose port 5678 publicly
```

### 3. Strong Passwords

- Use strong, unique passwords
- Rotate API keys regularly
- Use environment variables, never hardcode secrets

### 4. Database Security

- Use strong PostgreSQL passwords
- Don't expose database port publicly
- Regular backups

---

## Monitoring & Maintenance

### Check n8n Status

```bash
# Docker
docker ps | grep n8n
docker logs n8n --tail 50

# PM2
pm2 status
pm2 logs n8n
```

### Backup n8n Data

```bash
# Docker
docker exec n8n_postgres pg_dump -U n8n n8n > backup.sql

# Restore
docker exec -i n8n_postgres psql -U n8n n8n < backup.sql
```

### Update n8n

```bash
# Docker
docker-compose pull
docker-compose up -d

# npm
npm update -g n8n
pm2 restart n8n
```

---

## Troubleshooting

### n8n Won't Start

1. Check logs: `docker logs n8n` or `pm2 logs n8n`
2. Verify environment variables
3. Check database connection
4. Ensure ports aren't in use: `netstat -tulpn | grep 5678`

### API Key Not Working

1. Verify API key in n8n settings
2. Check `N8N_API_KEY` environment variable
3. Ensure API is enabled in n8n settings
4. Test with curl command above

### Workflows Not Executing

1. Check if workflow is active
2. Verify webhook URLs are correct
3. Check n8n logs for errors
4. Verify database connection

---

## Quick Start Script

Save this as `setup-n8n.sh`:

```bash
#!/bin/bash

# Generate secure keys
ENCRYPTION_KEY=$(openssl rand -base64 32)
API_KEY=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 24)
ADMIN_PASSWORD=$(openssl rand -base64 16)

echo "Generated Keys:"
echo "Encryption Key: $ENCRYPTION_KEY"
echo "API Key: $API_KEY"
echo "DB Password: $DB_PASSWORD"
echo "Admin Password: $ADMIN_PASSWORD"
echo ""
echo "Add these to your docker-compose.yml and .env file!"
```

Make it executable: `chmod +x setup-n8n.sh`

---

## Cost Estimation

### Self-Hosted (Docker on VPS)
- VPS: $5-20/month (DigitalOcean, Linode, etc.)
- Domain: $10-15/year
- **Total: ~$5-20/month**

### n8n Cloud
- Starter: $20/month
- Pro: $50/month
- **Total: $20-50/month**

---

## Next Steps

1. ✅ Set up n8n on your server
2. ✅ Get API key from n8n
3. ✅ Add `N8N_API_URL` and `N8N_API_KEY` to your environment variables
4. ✅ Test API connection
5. ✅ Create a test workflow to verify it works
6. ✅ Update Pro tier users to use hosted n8n

---

## Support

- n8n Documentation: https://docs.n8n.io
- n8n Community: https://community.n8n.io
- Docker Documentation: https://docs.docker.com


