# Medapp Maroc - Demarrage de l'environnement de dev
# Usage: .\start-all.ps1
$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot
Write-Host ""
Write-Host "Medapp Maroc - Demarrage de l'environnement de dev" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""
# 1. Verifier que Docker tourne
Write-Host "[1/4] Verification de Docker..." -ForegroundColor Yellow
docker ps 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERREUR: Docker Desktop n'est pas demarre." -ForegroundColor Red
    Write-Host "  Lance Docker Desktop manuellement, puis relance ce script." -ForegroundColor Red
    Read-Host "Appuie sur Entree pour quitter"
    exit 1
}
Write-Host "  OK Docker est pret" -ForegroundColor Green
# 2. Demarrer Postgres + Redis
Write-Host ""
Write-Host "[2/4] Demarrage Postgres + Redis..." -ForegroundColor Yellow
Set-Location $ProjectRoot
docker compose up -d
Write-Host "  OK Postgres et Redis sont up" -ForegroundColor Green
# 3. Attendre que Postgres soit pret
Write-Host ""
Write-Host "[3/4] Attente que Postgres accepte les connexions..." -ForegroundColor Yellow
$ready = $false
for ($i = 0; $i -lt 15; $i++) {
    docker exec medapp-postgres pg_isready -U medapp -d medapp_dev 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $ready = $true
        break
    }
    Start-Sleep -Seconds 1
}
if (-not $ready) {
    Write-Host "  ERREUR: Postgres n'a pas demarre a temps" -ForegroundColor Red
    exit 1
}
Write-Host "  OK Postgres est pret" -ForegroundColor Green
# 4. Lancer les 4 services
Write-Host ""
Write-Host "[4/4] Lancement des 4 services dans des fenetres separees..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot\apps\api'; Write-Host 'API NestJS - port 4000' -ForegroundColor Cyan; pnpm exec ts-node src/main.ts"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot'; Write-Host 'Patient - port 3000' -ForegroundColor Cyan; pnpm --filter web-patient dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot'; Write-Host 'Medecin - port 3001' -ForegroundColor Cyan; pnpm --filter web-doctor dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot'; Write-Host 'Landing - port 3002' -ForegroundColor Cyan; pnpm --filter web-landing dev"
Start-Sleep -Seconds 2
Write-Host ""
Write-Host "Tous les services sont lances !" -ForegroundColor Green
Write-Host "  - API NestJS  : http://localhost:4000" -ForegroundColor White
Write-Host "  - Patient     : http://localhost:3000" -ForegroundColor White
Write-Host "  - Medecin     : http://localhost:3001" -ForegroundColor White
Write-Host "  - Landing     : http://localhost:3002" -ForegroundColor White