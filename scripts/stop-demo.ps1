# =============================================================================
# Longevity Platform — Stop Demo Environment
# =============================================================================

$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent $PSScriptRoot

Write-Host "Stopping demo environment..." -ForegroundColor Yellow
docker compose -f "$ROOT\docker\docker-compose.demo.yml" down --remove-orphans

Write-Host ""
Write-Host "Demo stopped. To remove all data volumes, run:" -ForegroundColor Cyan
Write-Host "  docker compose -f docker/docker-compose.demo.yml down -v" -ForegroundColor White
Write-Host ""
Write-Host "Containers stopped." -ForegroundColor Green
