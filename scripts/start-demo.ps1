# =============================================================================
# Longevity Platform — Start Demo Environment
# =============================================================================
# This script builds and starts the entire demo stack.
# After starting, run: cloudflared tunnel --url http://localhost:8080
# =============================================================================

$ROOT = Split-Path -Parent $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Longevity Platform - Demo Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify Docker is running
Write-Host "[1/5] Checking Docker..." -ForegroundColor Yellow
docker info --format "{{.ServerVersion}}" 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker is not running. Please start Docker Desktop first."
    exit 1
}
Write-Host "  Docker is running." -ForegroundColor Green

# Step 2: Stop any existing demo containers
Write-Host "[2/5] Cleaning up previous demo..." -ForegroundColor Yellow
docker compose -f "$ROOT\docker\docker-compose.demo.yml" down --remove-orphans 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to clean up previous demo."
    exit 1
}
Write-Host "  Done." -ForegroundColor Green

# Step 3: Start infrastructure (PostgreSQL, Redis)
Write-Host "[3/5] Starting PostgreSQL and Redis..." -ForegroundColor Yellow
docker compose -f "$ROOT\docker\docker-compose.demo.yml" up -d postgres redis 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to start PostgreSQL/Redis."
    exit 1
}
Write-Host "  Waiting for databases to be ready..." -ForegroundColor Gray

# Wait for PostgreSQL
$pgReady = $false
for ($i = 0; $i -lt 30; $i++) {
    $status = docker inspect --format "{{.State.Health.Status}}" longevity-demo-db 2>$null
    if ($status -eq "healthy") { $pgReady = $true; break }
    Start-Sleep -Seconds 2
}

# Wait for Redis
$redisReady = $false
for ($i = 0; $i -lt 30; $i++) {
    $status = docker inspect --format "{{.State.Health.Status}}" longevity-demo-redis 2>$null
    if ($status -eq "healthy") { $redisReady = $true; break }
    Start-Sleep -Seconds 1
}

if (-not $pgReady) { Write-Error "PostgreSQL failed to start."; exit 1 }
if (-not $redisReady) { Write-Error "Redis failed to start."; exit 1 }
Write-Host "  PostgreSQL and Redis are ready." -ForegroundColor Green

# Step 4: Apply migrations
Write-Host "[4/5] Applying database migrations..." -ForegroundColor Yellow
docker compose -f "$ROOT\docker\docker-compose.demo.yml" run --rm `
    -e DATABASE_URL="postgresql://longevity_demo:demo_password@postgres:5432/longevity_demo?schema=public" `
    api npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma 2>$null
if ($LASTEXITCODE -ne 0) { Write-Error "Migration failed."; exit 1 }
Write-Host "  Migrations applied." -ForegroundColor Green

# Step 5: Start all services
Write-Host "[5/5] Starting API, Frontend, and Nginx..." -ForegroundColor Yellow
docker compose -f "$ROOT\docker\docker-compose.demo.yml" up -d api web nginx 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to start API/Frontend/Nginx."
    exit 1
}

# Wait for API
$apiReady = $false
for ($i = 0; $i -lt 60; $i++) {
    $status = docker inspect --format "{{.State.Health.Status}}" longevity-demo-api 2>$null
    if ($status -eq "healthy") { $apiReady = $true; break }
    Start-Sleep -Seconds 2
}

# Wait for Frontend
$webReady = $false
for ($i = 0; $i -lt 60; $i++) {
    $status = docker inspect --format "{{.State.Health.Status}}" longevity-demo-web 2>$null
    if ($status -eq "healthy") { $webReady = $true; break }
    Start-Sleep -Seconds 2
}

if (-not $apiReady) { Write-Error "API failed to start."; exit 1 }
if (-not $webReady) { Write-Warning "Frontend health check not yet ready, but continuing..." }

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Demo is running!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " Local access:    http://localhost:8080" -ForegroundColor White
Write-Host " API health:      http://localhost:8080/api/v1/health" -ForegroundColor White
Write-Host ""
Write-Host " To expose via Cloudflare Tunnel (in another terminal):" -ForegroundColor Yellow
Write-Host "   cloudflared tunnel --url http://localhost:8080" -ForegroundColor White
Write-Host ""
Write-Host " To stop the demo:" -ForegroundColor Yellow
Write-Host "   scripts\stop-demo.ps1" -ForegroundColor White
Write-Host ""

# Show running containers
docker compose -f "$ROOT\docker\docker-compose.demo.yml" ps 2>$null
