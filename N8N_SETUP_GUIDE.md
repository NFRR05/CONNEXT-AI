# n8n Local Setup Guide - Complete Integration

This guide walks you through setting up n8n locally for CONNEXT AI development.

## ✅ Step 1: Install Docker Desktop

1. **Download Docker Desktop for Windows**: https://www.docker.com/products/docker-desktop/
2. **Install and start Docker Desktop**
3. **Verify installation**:
   ```powershell
   docker --version
   docker-compose --version
   ```

## ✅ Step 2: Generate n8n Keys (Already Done!)

The keys have been generated and saved to `.env.n8n`. Your credentials are:

- **Admin Username**: `admin`
- **Admin Password**: Check `.env.n8n` file (N8N_ADMIN_PASSWORD)
- **API Key**: Check `.env.n8n` file (N8N_API_KEY)
- **Encryption Key**: Check `.env.n8n` file (N8N_ENCRYPTION_KEY)
- **Database Password**: Check `.env.n8n` file (N8N_DB_PASSWORD)

## ✅ Step 3: Start n8n with Docker

Once Docker is running, execute:

```powershell
cd "C:\CONNEXT AI"
docker-compose -f docker-compose.n8n.yml up -d
```

This will:
- Start PostgreSQL database container
- Start n8n container
- Create persistent volumes for data

**Check if containers are running**:
```powershell
docker ps
```

You should see:
- `n8n` container (port 5678)
- `n8n_postgres` container

**View logs** (if needed):
```powershell
docker-compose -f docker-compose.n8n.yml logs -f
```

## ✅ Step 4: Access n8n UI

1. **Open browser**: http://localhost:5678
2. **Login**:
   - Username: `admin`
   - Password: (from `.env.n8n` file, `N8N_ADMIN_PASSWORD`)

## ✅ Step 5: Create n8n API Key

1. In n8n UI, go to **Settings** → **API**
2. Click **"Create API Key"**
3. **Copy the API key** (you'll need this for CONNEXT AI)

⚠️ **Important**: This API key is different from the one in `.env.n8n`. The one in `.env.n8n` is for n8n's internal API configuration. The one you create in the UI is for external API access.

## ✅ Step 6: Configure CONNEXT AI

### Option A: If you have `.env.local`:

Add these lines to your `.env.local`:

```bash
# n8n Local Instance
N8N_API_URL=http://localhost:5678
N8N_API_KEY=<paste_the_api_key_from_step_5>
```

### Option B: If you don't have `.env.local`:

1. Copy `env.example` to `.env.local`:
   ```powershell
   Copy-Item env.example .env.local
   ```

2. Edit `.env.local` and update:
   ```bash
   N8N_API_URL=http://localhost:5678
   N8N_API_KEY=<your_api_key_from_n8n_ui>
   ```

## ✅ Step 7: Test the Connection

Test if n8n API is accessible:

```powershell
# Using PowerShell (Invoke-WebRequest)
$headers = @{
    "X-N8N-API-KEY" = "<your_api_key>"
}
Invoke-WebRequest -Uri "http://localhost:5678/api/v1/workflows" -Headers $headers
```

Or using curl (if available):
```bash
curl -X GET "http://localhost:5678/api/v1/workflows" -H "X-N8N-API-KEY: <your_api_key>"
```

**Expected response**: JSON array (empty `[]` if no workflows yet)

## ✅ Step 8: Verify Integration

Your CONNEXT AI code already includes:
- ✅ `lib/n8n/generator.ts` - Generates workflow blueprints
- ✅ `lib/n8n/hosted.ts` - Manages workflows via API

These will work once n8n is running and configured!

## 🛠️ Useful Commands

### Start n8n:
```powershell
docker-compose -f docker-compose.n8n.yml up -d
```

### Stop n8n:
```powershell
docker-compose -f docker-compose.n8n.yml down
```

### View logs:
```powershell
docker-compose -f docker-compose.n8n.yml logs -f n8n
```

### Restart n8n:
```powershell
docker-compose -f docker-compose.n8n.yml restart
```

### Remove everything (⚠️ deletes data):
```powershell
docker-compose -f docker-compose.n8n.yml down -v
```

## 🐛 Troubleshooting

### Port 5678 already in use:
- Change port in `docker-compose.n8n.yml`: `"5679:5678"` (left is host, right is container)
- Update `N8N_WEBHOOK_URL` in `.env.n8n` to match

### Containers won't start:
```powershell
# Check logs
docker-compose -f docker-compose.n8n.yml logs

# Check if Docker is running
docker ps
```

### PostgreSQL connection fails:
- Wait 10-15 seconds for PostgreSQL to fully start
- Check logs: `docker logs n8n_postgres`

### Can't access n8n UI:
- Verify Docker containers are running: `docker ps`
- Check if port 5678 is accessible: `netstat -an | findstr 5678`
- Try restarting: `docker-compose -f docker-compose.n8n.yml restart`

## 📝 Next Steps

Once n8n is running:
1. ✅ Test creating a workflow from CONNEXT AI
2. ✅ Test webhook ingestion
3. ✅ Verify workflow execution

## 📚 Additional Resources

- [n8n Documentation](https://docs.n8n.io)
- [Docker Desktop Documentation](https://docs.docker.com/desktop/)
- [CONNEXT AI n8n Integration](./docs/N8N_QUICK_START.md)

