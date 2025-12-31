# n8n Quick Start Guide

## Fastest Setup (5 minutes)

### 1. Generate Keys

```bash
# Run the setup script
chmod +x scripts/setup-n8n.sh
./scripts/setup-n8n.sh
```

This will generate all the keys you need.

### 2. Create .env File

Create `.env` file next to `docker-compose.n8n.yml`:

```bash
N8N_ADMIN_USER=admin
N8N_ADMIN_PASSWORD=<generated_password>
N8N_ENCRYPTION_KEY=<generated_encryption_key>
N8N_API_KEY=<generated_api_key>
N8N_DB_PASSWORD=<generated_db_password>
N8N_WEBHOOK_URL=http://localhost:5678/
N8N_HOST=localhost
N8N_PROTOCOL=http
N8N_SECURE_COOKIE=false
```

### 3. Start n8n

```bash
docker-compose -f docker-compose.n8n.yml up -d
```

### 4. Access n8n

Open: `http://localhost:5678`
Login: `admin` / `<your_admin_password>`

### 5. Get API Key

1. Go to Settings → API
2. Create API Key
3. Copy it

### 6. Add to CONNEXT AI

Add to your `.env.local`:

```bash
N8N_API_URL=http://localhost:5678
N8N_API_KEY=<your_api_key>
```

### 7. Test

```bash
curl -X GET "http://localhost:5678/api/v1/workflows" \
  -H "X-N8N-API-KEY: your_api_key"
```

Done! 🎉

---

## Production Setup

For production, you need:

1. **Domain name** (e.g., `n8n.yourdomain.com`)
2. **SSL certificate** (Let's Encrypt is free)
3. **Reverse proxy** (Nginx)
4. **Update .env** with production values

See `N8N_HOSTING_GUIDE.md` for detailed production setup.


