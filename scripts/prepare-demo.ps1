# =============================================================================
# Longevity Platform - Prepare Demo (checklist anti-falha)
# =============================================================================
# Run every check before a commercial presentation. Exit code 0 = ready.
# =============================================================================

$ROOT = Split-Path -Parent $PSScriptRoot
$BASE = "http://localhost:8080"

# Dify API key comes from .env.demo (never committed)
$DIFY_API_KEY = $null
$envFile = Join-Path $ROOT ".env.demo"
if (Test-Path $envFile) {
    $difyLine = Get-Content $envFile | Where-Object { $_ -match "^DIFY_API_KEY=" } | Select-Object -First 1
    if ($difyLine) { $DIFY_API_KEY = $difyLine.Substring($difyLine.IndexOf("=") + 1).Trim() }
}

$results = @()
function Report($name, $status, $detail) {
    $script:results += [pscustomobject]@{ Name = $name; Status = $status; Detail = $detail }
    $color = switch ($status) { "OK" { "Green" } "WARNING" { "Yellow" } "FAIL" { "Red" } }
    Write-Host ("  [{0}] {1} - {2}" -f $status, $name, $detail) -ForegroundColor $color
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Longevity Platform - Demo Preparation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Docker
Write-Host "1/8 Docker" -ForegroundColor Yellow
docker info --format "{{.ServerVersion}}" 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) { Report "Docker a correr" "OK" "Docker Desktop ativo" }
else { Report "Docker a correr" "FAIL" "Inicie o Docker Desktop"; Write-Host "Aborting." -ForegroundColor Red; exit 1 }

# 2. Containers
Write-Host "2/8 Containers" -ForegroundColor Yellow
$containers = @("longevity-demo-db", "longevity-demo-redis", "longevity-demo-api", "longevity-demo-web", "longevity-demo-nginx")
foreach ($c in $containers) {
    $status = docker inspect --format "{{.State.Health.Status}}" $c 2>$null
    if ($status -eq "healthy") { Report $c "OK" "healthy" }
    elseif ($status) { Report $c "WARNING" "health: $status - aguarde ou corra start-demo.ps1" }
    else { Report $c "FAIL" "container nao existe - corra scripts\start-demo.ps1" }
}

# 3. API health
Write-Host "3/8 API" -ForegroundColor Yellow
try {
    $h = Invoke-RestMethod -Uri "$BASE/api/v1/health" -TimeoutSec 10
    if ($h.data.status -eq "ok") { Report "API health" "OK" "status ok" }
    else { Report "API health" "FAIL" "resposta inesperada" }
} catch { Report "API health" "FAIL" $_.Exception.Message }

# 4. Login (admin)
Write-Host "4/8 Autenticacao" -ForegroundColor Yellow
$token = $null
try {
    $body = @{ email = 'admin@longevity.local'; password = 'dev-password-123' } | ConvertTo-Json
    $login = Invoke-RestMethod -Method Post -Uri "$BASE/api/v1/auth/login" -ContentType "application/json" -Body $body -TimeoutSec 10
    $token = $login.data.accessToken
    Report "Login admin" "OK" "admin@longevity.local autenticado"
} catch { Report "Login admin" "FAIL" $_.Exception.Message }

# 5. Modo de apresentacao
Write-Host "5/8 Modo de apresentacao" -ForegroundColor Yellow
if ($token) {
    $headers = @{ Authorization = "Bearer $token" }
    try {
        $ov = Invoke-RestMethod -Uri "$BASE/api/v1/presentation/overview" -Headers $headers -TimeoutSec 10
        $v = $ov.data.value
        $c = $ov.data.counts
        Report "Modo de apresentacao" "OK" ("org: {0} | MRR {1} EUR/mes | leads {2} | em risco {3}" -f $ov.data.organization.name, [math]::Round($v.mrr), $c.leadsTotal, $c.customersAtRisk)
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 404) {
            Report "Modo de apresentacao" "FAIL" "DEMO_PRESENTATION_MODE nao ativo - verifique docker\.env e docker-compose.demo.yml"
        } else { Report "Modo de apresentacao" "FAIL" $_.Exception.Message }
    }
} else {
    Report "Modo de apresentacao" "SKIP" "sem token (login falhou)"
}

# 6. Dados essenciais
Write-Host "6/8 Dados demo" -ForegroundColor Yellow
if ($token) {
    $headers = @{ Authorization = "Bearer $token" }
    $checks = @(
        @{ Name = "Leads suficientes"; Url = "/leads?limit=1"; Min = 1 },
        @{ Name = "Clientes suficientes"; Url = "/customers?limit=1"; Min = 1 },
        @{ Name = "Check-ins com historico"; Url = "/checkins?limit=1"; Min = 1 },
        @{ Name = "Pipeline configurado"; Url = "/pipeline"; Min = 1 }
    )
    foreach ($ch in $checks) {
        try {
            $r = Invoke-RestMethod -Uri "$BASE/api/v1$($ch.Url)" -Headers $headers -TimeoutSec 10
            $count = if ($r.data -is [System.Array]) { $r.data.Count } elseif ($r.data.data) { $r.data.data.Count } else { 1 }
            if ($count -ge $ch.Min) { Report $ch.Name "OK" "$count registos" }
            else { Report $ch.Name "FAIL" "menos de $($ch.Min) registos" }
        } catch { Report $ch.Name "FAIL" $_.Exception.Message }
    }
}

# 7. Frontend
Write-Host "7/8 Frontend" -ForegroundColor Yellow
try {
    $resp = Invoke-WebRequest -Uri "$BASE/presentation" -TimeoutSec 15 -MaximumRedirection 0 -ErrorAction Stop
    $code = [int]$resp.StatusCode
    if ($code -in @(200, 307, 308)) { Report "Frontend responde" "OK" "HTTP $code em /presentation" }
    else { Report "Frontend responde" "WARNING" "HTTP $code (esperado redirecao para login)" }
} catch {
    $code = [int]$_.Exception.Response.StatusCode.value__
    if ($code -in @(200, 307, 308)) { Report "Frontend responde" "OK" "HTTP $code em /presentation" }
    else { Report "Frontend responde" "WARNING" "HTTP $code ou erro de ligacao" }
}

# 8. IA (Dify + Ollama) - prova viva do Ato 1
Write-Host "8/9 IA (Dify + Ollama)" -ForegroundColor Yellow
$ollamaOk = $false
try {
    $tags = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -TimeoutSec 5
    if ($tags.models.Count -gt 0) { Report "Ollama (modelo local)" "OK" "$($tags.models.Count) modelo(s) disponiveis" ; $ollamaOk = $true }
    else { Report "Ollama (modelo local)" "FAIL" "sem modelos - corra: ollama pull llama3.2:3b" }
} catch { Report "Ollama (modelo local)" "FAIL" "Ollama nao responde em :11434" }

if ($ollamaOk) {
    if (-not $DIFY_API_KEY) {
        Report "Dify (chat-messages)" "WARNING" "DIFY_API_KEY nao definida em .env.demo - skip probe"
    } else {
        $difyBody = @{ inputs = @{}; query = "teste"; response_mode = "blocking"; conversation_id = ""; user = "prep-check" } | ConvertTo-Json -Depth 5
        $tempProbe = Join-Path $env:TEMP "opencode\dify-prep-probe.json"
        $difyBody | Out-File -FilePath $tempProbe -Encoding utf8
        curl.exe -sS -m 15 -X POST http://localhost:80/v1/chat-messages -H "Authorization: Bearer $DIFY_API_KEY" -H "Content-Type: application/json" --data-binary "@$tempProbe" -w "HTTP:%{http_code}" -o $env:TEMP\opencode\dify-prep-out.json 2>$null | Out-Null
        $code = $LASTEXITCODE
        if ($code -eq 0) { Report "Dify (chat-messages)" "OK" "responde (o modelo quente responde em segundos)" }
        else { Report "Dify (chat-messages)" "WARNING" "timeout de 15s - modelo frio? a 1a resposta leva ~30s" }
    }
}

# 9. Extras
Write-Host "9/9 Extras" -ForegroundColor Yellow
$cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
if ($cloudflared) { Report "cloudflared instalado" "OK" "use: cloudflared tunnel --url http://localhost:8080" }
else { Report "cloudflared instalado" "WARNING" "nao encontrado - sem acesso remoto" }

# Summary
Write-Host ""
Write-Host "==================== RELATORIO ====================" -ForegroundColor Cyan
$fails = @($results | Where-Object { $_.Status -eq "FAIL" })
$warns = @($results | Where-Object { $_.Status -eq "WARNING" })
$oks = @($results | Where-Object { $_.Status -eq "OK" })
Write-Host ("  OK: {0} | WARNING: {1} | FAIL: {2}" -f $oks.Count, $warns.Count, $fails.Count)

if ($fails.Count -eq 0) {
    Write-Host ""
    Write-Host "  A demo esta PRONTA para apresentacao." -ForegroundColor Green
    Write-Host "  Roteiro: docs\demo-presentation.md" -ForegroundColor White
    exit 0
} else {
    Write-Host ""
    Write-Host "  A demo NAO esta pronta. Corrija os itens acima antes de apresentar." -ForegroundColor Red
    exit 1
}
