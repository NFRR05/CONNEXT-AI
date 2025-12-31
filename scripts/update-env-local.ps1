# Update .env.local with n8n API Key
# Usage: .\scripts\update-env-local.ps1 -ApiKey "your_api_key_here"

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey
)

$envLocalPath = ".env.local"
$envExamplePath = "env.example"

Write-Host "Updating .env.local with n8n configuration..." -ForegroundColor Cyan

# Check if .env.local exists, if not create from env.example
if (-not (Test-Path $envLocalPath)) {
    if (Test-Path $envExamplePath) {
        Write-Host "Creating .env.local from env.example..." -ForegroundColor Yellow
        Copy-Item $envExamplePath $envLocalPath
    } else {
        Write-Host "[ERROR] env.example not found. Creating basic .env.local..." -ForegroundColor Yellow
        @"
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Vapi.ai API Key
VAPI_API_KEY=your_vapi_api_key

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key

# Application URL (for webhook callbacks)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# n8n Local Instance
N8N_API_URL=http://localhost:5678
N8N_API_KEY=
"@ | Out-File -FilePath $envLocalPath -Encoding utf8
    }
}

# Read current .env.local
$content = Get-Content $envLocalPath -Raw

# Update or add N8N_API_URL
if ($content -match "N8N_API_URL=(.+)") {
    $content = $content -replace "N8N_API_URL=.+", "N8N_API_URL=http://localhost:5678"
    Write-Host "[OK] Updated N8N_API_URL" -ForegroundColor Green
} else {
    $content += "`n# n8n Local Instance`nN8N_API_URL=http://localhost:5678`n"
    Write-Host "[OK] Added N8N_API_URL" -ForegroundColor Green
}

# Update or add N8N_API_KEY
if ($content -match "N8N_API_KEY=(.+)") {
    $content = $content -replace "N8N_API_KEY=.+", "N8N_API_KEY=$ApiKey"
    Write-Host "[OK] Updated N8N_API_KEY" -ForegroundColor Green
} else {
    $content += "N8N_API_KEY=$ApiKey`n"
    Write-Host "[OK] Added N8N_API_KEY" -ForegroundColor Green
}

# Write back to file
$content | Out-File -FilePath $envLocalPath -Encoding utf8 -NoNewline

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "[OK] .env.local updated successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "n8n Configuration:" -ForegroundColor Cyan
Write-Host "  N8N_API_URL=http://localhost:5678" -ForegroundColor White
Write-Host "  N8N_API_KEY=$ApiKey" -ForegroundColor White
Write-Host ""

