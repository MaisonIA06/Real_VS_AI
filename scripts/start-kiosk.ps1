# =============================================================================
# Script de lancement Real vs AI en mode Kiosque (plein écran)
# =============================================================================

param(
    [string]$Url = "http://localhost:8080",
    [int]$WaitSeconds = 15,
    [switch]$NoBuild
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Real vs AI - Mode Kiosque" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Se placer dans le dossier du projet (parent du dossier scripts)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
Set-Location $ProjectDir

# Verification de Docker
Write-Host "[0/3] Verification de Docker..." -ForegroundColor Yellow

$dockerRunning = $false
try {
    $null = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerRunning = $true
    }
} catch {
    $dockerRunning = $false
}

if (-not $dockerRunning) {
    Write-Host "Docker n'est pas lance. Tentative de demarrage..." -ForegroundColor Yellow
    
    # Chercher Docker Desktop
    $dockerDesktopPath = @(
        "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe",
        "$env:LOCALAPPDATA\Docker\Docker Desktop.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1
    
    if ($dockerDesktopPath) {
        Write-Host "Demarrage de Docker Desktop..." -ForegroundColor Gray
        Start-Process $dockerDesktopPath
        
        Write-Host "Attente du demarrage de Docker (peut prendre 30-60 secondes)..." -ForegroundColor Yellow
        
        $maxWait = 90
        $waited = 0
        $interval = 5
        
        while ($waited -lt $maxWait) {
            Start-Sleep -Seconds $interval
            $waited += $interval
            
            try {
                $null = docker info 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "Docker est pret!" -ForegroundColor Green
                    $dockerRunning = $true
                    break
                }
            } catch {}
            
            $percent = [math]::Round(($waited / $maxWait) * 100)
            Write-Progress -Activity "Attente de Docker" -Status "$waited/$maxWait sec" -PercentComplete $percent
        }
        Write-Progress -Activity "Attente de Docker" -Completed
        
        if (-not $dockerRunning) {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Red
            Write-Host "   ERREUR: Docker n'a pas demarre" -ForegroundColor Red
            Write-Host "========================================" -ForegroundColor Red
            Write-Host ""
            Write-Host "Veuillez demarrer Docker Desktop manuellement" -ForegroundColor Yellow
            Write-Host "puis relancer ce script." -ForegroundColor Yellow
            Write-Host ""
            Read-Host "Appuyez sur Entree pour quitter"
            exit 1
        }
    } else {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "   ERREUR: Docker non trouve!" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "Veuillez installer Docker Desktop depuis:" -ForegroundColor Yellow
        Write-Host "https://www.docker.com/products/docker-desktop" -ForegroundColor Cyan
        Write-Host ""
        Read-Host "Appuyez sur Entree pour quitter"
        exit 1
    }
} else {
    Write-Host "Docker est operationnel!" -ForegroundColor Green
}

Write-Host ""

# Lancer Docker Compose
Write-Host "[1/3] Demarrage des services Docker..." -ForegroundColor Yellow

if ($NoBuild) {
    docker-compose up -d
} else {
    docker-compose up -d --build
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors du demarrage de Docker Compose" -ForegroundColor Red
    Read-Host "Appuyez sur Entree pour quitter"
    exit 1
}

Write-Host "[2/3] Attente du demarrage des services ($WaitSeconds secondes)..." -ForegroundColor Yellow

# Barre de progression
for ($i = 0; $i -lt $WaitSeconds; $i++) {
    $percent = [math]::Round(($i / $WaitSeconds) * 100)
    Write-Progress -Activity "Demarrage des services" -Status "$percent% - $i/$WaitSeconds sec" -PercentComplete $percent
    Start-Sleep -Seconds 1
}
Write-Progress -Activity "Demarrage des services" -Completed

# Vérifier que le service répond
Write-Host "[3/3] Verification de la disponibilite..." -ForegroundColor Yellow

$maxRetries = 10
$retryCount = 0
$serviceReady = $false

while (-not $serviceReady -and $retryCount -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $serviceReady = $true
        }
    } catch {
        $retryCount++
        Write-Host "  Tentative $retryCount/$maxRetries..." -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $serviceReady) {
    Write-Host "Attention: Le service ne repond pas encore, ouverture du navigateur quand meme..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Ouverture du navigateur en mode plein ecran..." -ForegroundColor Green
Write-Host "URL: $Url" -ForegroundColor Gray
Write-Host ""
Write-Host "Pour quitter: Appuyez sur F11 ou Alt+F4" -ForegroundColor Cyan
Write-Host ""

# Détecter le navigateur disponible et lancer en mode kiosque
$chromePath = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

$edgePath = @(
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

$firefoxPath = @(
    "$env:ProgramFiles\Mozilla Firefox\firefox.exe",
    "${env:ProgramFiles(x86)}\Mozilla Firefox\firefox.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($chromePath) {
    Write-Host "Utilisation de Chrome" -ForegroundColor Gray
    Start-Process $chromePath -ArgumentList "--kiosk", "--disable-infobars", "--disable-session-crashed-bubble", $Url
} elseif ($edgePath) {
    Write-Host "Utilisation de Edge" -ForegroundColor Gray
    Start-Process $edgePath -ArgumentList "--kiosk", "--disable-infobars", $Url
} elseif ($firefoxPath) {
    Write-Host "Utilisation de Firefox" -ForegroundColor Gray
    Start-Process $firefoxPath -ArgumentList "--kiosk", $Url
} else {
    Write-Host "Aucun navigateur compatible trouve, ouverture par defaut..." -ForegroundColor Yellow
    Start-Process $Url
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   Application lancee avec succes!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
