# n8n Status Check Script for Windows
# This script checks if n8n is running

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "n8n Status Check" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker
try {
    docker --version | Out-Null
    Write-Host "[OK] Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker is not installed" -ForegroundColor Red
    exit 1
}

# Check containers
Write-Host ""
Write-Host "Container Status:" -ForegroundColor Cyan
docker ps --filter "name=n8n" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

Write-Host ""
Write-Host "Testing n8n API..." -ForegroundColor Cyan

# Check if .env.local exists and has API key
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "N8N_API_KEY=(.+)") {
        $apiKey = $matches[1].Trim()
        Write-Host "[OK] Found API key in .env.local" -ForegroundColor Green
        
        # Test API
        try {
            $headers = @{
                "X-N8N-API-KEY" = $apiKey
            }
            $response = Invoke-WebRequest -Uri "http://localhost:5678/api/v1/workflows" -Headers $headers -UseBasicParsing -ErrorAction Stop
            Write-Host "[OK] n8n API is accessible (Status: $($response.StatusCode))" -ForegroundColor Green
        } catch {
            Write-Host "[ERROR] n8n API is not accessible" -ForegroundColor Red
            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[WARNING] N8N_API_KEY not found in .env.local" -ForegroundColor Yellow
    }
} else {
    Write-Host "[WARNING] .env.local not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Access n8n UI: http://localhost:5678" -ForegroundColor Cyan
Write-Host ""

