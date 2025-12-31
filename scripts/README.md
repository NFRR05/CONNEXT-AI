# CONNEXT AI - Scripts Directory

This directory contains helper scripts for setting up and managing n8n integration.

## Setup Scripts

### `setup-n8n-env.js`
Generates secure keys and creates `.env.n8n` file for Docker configuration.

**Usage:**
```bash
node scripts/setup-n8n-env.js
```

**What it does:**
- Generates encryption key, API key, database password, and admin password
- Creates `.env.n8n` file with all required configuration
- Displays generated keys for reference

---

### `generate-n8n-keys.js`
Generates and displays secure keys (without creating files).

**Usage:**
```bash
node scripts/generate-n8n-keys.js
```

---

## Docker Management Scripts (Windows PowerShell)

### `start-n8n.ps1`
Starts n8n Docker containers.

**Usage:**
```powershell
.\scripts\start-n8n.ps1
```

**What it does:**
- Checks if Docker is installed
- Verifies `.env.n8n` exists
- Starts n8n and PostgreSQL containers
- Displays next steps

---

### `stop-n8n.ps1`
Stops n8n Docker containers.

**Usage:**
```powershell
.\scripts\stop-n8n.ps1
```

---

### `check-n8n.ps1`
Checks n8n status and tests API connection.

**Usage:**
```powershell
.\scripts\check-n8n.ps1
```

**What it does:**
- Checks if Docker is running
- Shows container status
- Tests n8n API connection (if API key is in `.env.local`)

---

## Configuration Scripts

### `update-env-local.ps1`
Updates `.env.local` with n8n API key.

**Usage:**
```powershell
.\scripts\update-env-local.ps1 -ApiKey "your_api_key_from_n8n_ui"
```

**What it does:**
- Creates `.env.local` from `env.example` if it doesn't exist
- Updates or adds `N8N_API_URL` and `N8N_API_KEY`
- Preserves existing configuration

---

## Quick Start Workflow

1. **Generate keys and create .env.n8n:**
   ```bash
   node scripts/setup-n8n-env.js
   ```

2. **Start n8n:**
   ```powershell
   .\scripts\start-n8n.ps1
   ```

3. **Get API key from n8n UI:**
   - Open http://localhost:5678
   - Go to Settings → API → Create API Key

4. **Update .env.local:**
   ```powershell
   .\scripts\update-env-local.ps1 -ApiKey "your_api_key_here"
   ```

5. **Verify setup:**
   ```powershell
   .\scripts\check-n8n.ps1
   ```

---

## Notes

- All scripts assume you're running from the project root directory
- `.env.n8n` is gitignored (contains sensitive keys)
- `.env.local` is gitignored (contains your local configuration)
- Make sure Docker Desktop is running before using Docker scripts

