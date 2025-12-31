# n8n Start Script for Windows
# This script starts n8n Docker containers

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Starting n8n Docker Containers" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is available
try {
    $dockerVersion = docker --version 2>&1
    Write-Host "[OK] Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker is not installed or not in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Docker Desktop from:" -ForegroundColor Yellow
    Write-Host "https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Check if .env.n8n exists
if (-not (Test-Path ".env.n8n")) {
    Write-Host "[ERROR] .env.n8n file not found!" -ForegroundColor Red
    Write-Host "Please run: node scripts/setup-n8n-env.js" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] .env.n8n file found" -ForegroundColor Green
Write-Host ""

# Start Docker containers
Write-Host "Starting n8n containers..." -ForegroundColor Cyan
docker-compose -f docker-compose.n8n.yml --env-file .env.n8n up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "[OK] n8n started successfully!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Wait 10-15 seconds for containers to start" -ForegroundColor White
    Write-Host "2. Open browser: http://localhost:5678" -ForegroundColor White
    Write-Host "3. Login with admin credentials from .env.n8n" -ForegroundColor White
    Write-Host ""
    Write-Host "Check container status:" -ForegroundColor Cyan
    Write-Host "  docker ps" -ForegroundColor Gray
    Write-Host ""
    Write-Host "View logs:" -ForegroundColor Cyan
    Write-Host "  docker-compose -f docker-compose.n8n.yml --env-file .env.n8n logs -f" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[ERROR] Failed to start n8n containers" -ForegroundColor Red
    Write-Host "Check logs: docker-compose -f docker-compose.n8n.yml --env-file .env.n8n logs" -ForegroundColor Yellow
    exit 1
}

