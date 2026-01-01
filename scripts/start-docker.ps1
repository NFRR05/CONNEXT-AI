# Load environment variables from .env.local
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process')
    }
}

# Start Docker services
docker-compose -f docker-compose.n8n.yml up -d --build

# Check status
docker-compose -f docker-compose.n8n.yml ps