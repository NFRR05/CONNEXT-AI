# n8n Stop Script for Windows
# This script stops n8n Docker containers

Write-Host "Stopping n8n Docker containers..." -ForegroundColor Cyan
docker-compose -f docker-compose.n8n.yml --env-file .env.n8n down

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] n8n stopped successfully!" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to stop n8n containers" -ForegroundColor Red
}

