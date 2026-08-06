@echo off
setlocal enabledelayedexpansion

REM ===========================================================================
REM Longevity Platform — Iniciar Ambiente de Demonstração
REM ===========================================================================
REM Uso:  double-click ou start-demo.bat
REM
REM Depois de iniciado, noutro terminal:
REM   cloudflared tunnel --url http://localhost:8080
REM ===========================================================================

cd /d "%~dp0"

title Longevity Platform — Demo
color 0B

echo ========================================
echo  Longevity Platform - Demo Environment
echo ========================================
echo.

REM ── Step 0: Create .env.demo if missing ───────────────────────────────────
if not exist .env.demo (
    echo  A criar .env.demo a partir de .env.demo.example...
    copy /y .env.demo.example .env.demo >nul
    if errorlevel 1 (
        echo  ERROR: nao foi possivel criar .env.demo.
        pause
        exit /b 1
    )
)

REM ── Step 1: Check Docker ──────────────────────────────────────────────────
echo [1/7] A verificar Docker...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo  ERROR: Docker nao esta a correr. Inicia o Docker Desktop primeiro.
    pause
    exit /b 1
)
echo  Docker OK.

REM ── Step 2: Clean up previous demo ────────────────────────────────────────
echo [2/7] A limpar demo anterior...
docker compose --env-file .env.demo -f docker\docker-compose.demo.yml down --remove-orphans >nul 2>&1
echo  OK.

REM ── Step 3: Start PostgreSQL and Redis ────────────────────────────────────
echo [3/7] A iniciar PostgreSQL e Redis...
docker compose --env-file .env.demo -f docker\docker-compose.demo.yml up -d postgres redis
echo  A aguardar que as bases de dados estejam prontas...

REM Wait for PostgreSQL
set pgReady=0
for /l %%i in (1,1,30) do (
    docker inspect --format "{{.State.Health.Status}}" longevity-demo-db 2>nul | findstr /c:"healthy" >nul
    if !errorlevel! equ 0 (
        set pgReady=1
        goto pgReady
    )
    timeout /t 2 /nobreak >nul
)
:pgReady
if %pgReady% neq 1 (
    echo  ERROR: PostgreSQL nao iniciou.
    pause
    exit /b 1
)

REM Wait for Redis
set redisReady=0
for /l %%i in (1,1,30) do (
    docker inspect --format "{{.State.Health.Status}}" longevity-demo-redis 2>nul | findstr /c:"healthy" >nul
    if !errorlevel! equ 0 (
        set redisReady=1
        goto redisReady
    )
    timeout /t 1 /nobreak >nul
)
:redisReady
if %redisReady% neq 1 (
    echo  ERROR: Redis nao iniciou.
    pause
    exit /b 1
)
echo  Bases de dados prontas.

REM ── Step 4: Build API and Web images ──────────────────────────────────────
echo [4/7] A construir as imagens (primeira vez pode demorar)...
docker compose --env-file .env.demo -f docker\docker-compose.demo.yml build api web
if %errorlevel% neq 0 (
    echo  ERROR: Build falhou.
    pause
    exit /b 1
)
echo  Imagens construidas.

REM ── Step 5: Run migrations ────────────────────────────────────────────────
echo [5/7] A aplicar migracoes...
docker compose --env-file .env.demo -f docker\docker-compose.demo.yml run --rm ^
    -e DATABASE_URL="postgresql://longevity_demo:demo_password@postgres:5432/longevity_demo?schema=public" ^
    -w /app/apps/api api npx prisma migrate deploy
if %errorlevel% neq 0 (
    echo  ERROR: Migracao falhou.
    pause
    exit /b 1
)
echo  Migracoes aplicadas.

REM ── Step 6: Seed demo data ────────────────────────────────────────────────
echo [6/7] A carregar dados de demonstracao...
docker compose --env-file .env.demo -f docker\docker-compose.demo.yml run --rm ^
    -e DATABASE_URL="postgresql://longevity_demo:demo_password@postgres:5432/longevity_demo?schema=public" ^
    -w /app/apps/api api npm run db:seed
if %errorlevel% neq 0 (
    echo  ERROR: Seed falhou.
    pause
    exit /b 1
)
echo  Dados carregados.

REM ── Step 7: Start remaining services ──────────────────────────────────────
echo [7/7] A iniciar API, Frontend e Nginx...
docker compose --env-file .env.demo -f docker\docker-compose.demo.yml up -d api web nginx

REM Wait for API
set apiReady=0
for /l %%i in (1,1,60) do (
    docker inspect --format "{{.State.Health.Status}}" longevity-demo-api 2>nul | findstr /c:"healthy" >nul
    if !errorlevel! equ 0 (
        set apiReady=1
        goto apiReady
    )
    timeout /t 2 /nobreak >nul
)
:apiReady
if %apiReady% neq 1 (
    echo  ERROR: API nao iniciou.
    pause
    exit /b 1
)

REM Wait for frontend (optional)
set webReady=0
for /l %%i in (1,1,30) do (
    docker inspect --format "{{.State.Health.Status}}" longevity-demo-web 2>nul | findstr /c:"healthy" >nul
    if !errorlevel! equ 0 (
        set webReady=1
        goto webReady
    )
    timeout /t 2 /nobreak >nul
)
:webReady
if %webReady% equ 1 (
    echo  Frontend pronto.
) else (
    echo  ATENCAO: Frontend ainda a iniciar, mas continua...
)

echo.
echo ========================================
echo  Demo pronta!
echo ========================================
echo.
echo  Acesso local:    http://localhost:8080
echo  Health API:      http://localhost:8080/api/v1/health
echo.
echo  Para expor via Cloudflare Tunnel (noutro terminal):
echo    cloudflared tunnel --url http://localhost:8080
echo.
echo  Para parar:  stop-demo.bat
echo.

REM Show running containers
docker compose --env-file .env.demo -f docker\docker-compose.demo.yml ps

pause
