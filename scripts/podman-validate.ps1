# ==============================================================================
# Distributed Compute Marketplace — Podman Automated Validation Suite
# ==============================================================================

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  🚀 RUNNING FULL AUTOMATED VALIDATION SUITE (PODMAN RUNNER)    " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

$root = (Get-Item .).FullName
$hasFailed = $false

# 1. Verify Podman is operational
Write-Host "`n[1/6] Verifying Podman Environment..." -ForegroundColor Yellow
$podmanVer = podman --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Podman is not running or accessible!" -ForegroundColor Red
    exit 1
}
Write-Host "  ✅ Podman is operational: $podmanVer" -ForegroundColor Green

# 2. Build and Test TypeScript (Shared Types, API, Web) inside Node Container
Write-Host "`n[2/6] Running TypeScript Linting, Typecheck & Tests in Node 20 Container..." -ForegroundColor Yellow
podman run --rm -v "${root}:/workspace:z" -w /workspace docker.io/library/node:20-alpine sh /workspace/scripts/run-node-tests.sh

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js validation / build failed!" -ForegroundColor Red
    $hasFailed = $true
} else {
    Write-Host "  ✅ Node.js build and test suite passed!" -ForegroundColor Green
}

# 3. Test Python Provider Agent inside Python 3.11 Container
Write-Host "`n[3/6] Running Provider Agent Unit Tests in Python 3.11 Container..." -ForegroundColor Yellow
podman run --rm -v "${root}:/workspace:z" -w /workspace/apps/provider-agent docker.io/library/python:3.11-slim sh /workspace/scripts/run-python-tests.sh

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Python Provider Agent tests failed!" -ForegroundColor Red
    $hasFailed = $true
} else {
    Write-Host "  ✅ Python Provider Agent tests passed!" -ForegroundColor Green
}

# 4. Validate Dockerfile Builds
Write-Host "`n[4/6] Validating Podman Image Builds..." -ForegroundColor Yellow
podman build -t marketplace-api:test -f infrastructure/docker/api.Dockerfile .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ API Dockerfile build failed!" -ForegroundColor Red
    $hasFailed = $true
} else {
    Write-Host "  ✅ API Docker image built successfully!" -ForegroundColor Green
}

podman build -t marketplace-agent:test -f infrastructure/docker/agent.Dockerfile .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Agent Dockerfile build failed!" -ForegroundColor Red
    $hasFailed = $true
} else {
    Write-Host "  ✅ Agent Docker image built successfully!" -ForegroundColor Green
}

# 5. Check Documentation Integrity
Write-Host "`n[5/6] Verifying Documentation Suite in docs/..." -ForegroundColor Yellow
$requiredDocs = @(
    "REQUIREMENTS.md", "ARCHITECTURE.md", "API.md",
    "SETUP.md", "CONFIGURATION.md", "SECURITY.md", "TESTING.md",
    "DEPLOYMENT.md", "USER_GUIDE.md", "PROVIDER_GUIDE.md", "CONTRIBUTING.md",
    "ROADMAP.md", "PROJECT_STATUS.md", "GAP_ANALYSIS.md", "CODEBASE_UNDERSTANDING.md",
    "RUNBOOK_PRODUCTION.md", "SECURITY_AUDIT.md", "TODO.md", "CHANGELOG.md"
)

$missingDocs = 0
foreach ($doc in $requiredDocs) {
    if (-not (Test-Path "docs/$doc")) {
        Write-Host "  ❌ Missing required doc: docs/$doc" -ForegroundColor Red
        $missingDocs++
    }
}

if ($missingDocs -eq 0) {
    Write-Host "  ✅ All $($requiredDocs.Count) required documentation files verified in docs/!" -ForegroundColor Green
} else {
    $hasFailed = $true
}

# 6. Final Summary
Write-Host "`n================================================================" -ForegroundColor Cyan
if ($hasFailed) {
    Write-Host "  ❌ AUTOMATED VALIDATION FAILED! Check logs above." -ForegroundColor Red
    Write-Host "================================================================" -ForegroundColor Cyan
    exit 1
} else {
    Write-Host "  🎉 FULL MASTER VALIDATION COMPLETED SUCCESSFULLY (100% PASS)    " -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Cyan
    exit 0
}
