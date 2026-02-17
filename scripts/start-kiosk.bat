@echo off
chcp 65001 >nul
title Real vs AI - Mode Kiosque

echo ========================================
echo    Real vs AI - Mode Kiosque
echo ========================================
echo.

REM Aller dans le dossier parent (ou se trouve docker-compose.yml)
pushd "%~dp0\.."

REM Verification de Docker
echo [0/3] Verification de Docker...

docker info >nul 2>&1
if %ERRORLEVEL% neq 0 goto :start_docker
goto :docker_ok

:start_docker
echo Docker n'est pas lance. Tentative de demarrage...

REM Essayer de lancer Docker Desktop
if exist "%ProgramFiles%\Docker\Docker\Docker Desktop.exe" (
    start "" "%ProgramFiles%\Docker\Docker\Docker Desktop.exe"
    echo Demarrage de Docker Desktop en cours...
    goto :wait_docker
)
if exist "%LOCALAPPDATA%\Docker\Docker Desktop.exe" (
    start "" "%LOCALAPPDATA%\Docker\Docker Desktop.exe"
    echo Demarrage de Docker Desktop en cours...
    goto :wait_docker
)

echo.
echo ========================================
echo    ERREUR: Docker non trouve!
echo ========================================
echo.
echo Veuillez installer Docker Desktop depuis:
echo https://www.docker.com/products/docker-desktop
echo.
pause
popd
exit /b 1

:wait_docker
echo Attente du demarrage de Docker (peut prendre 30-60 secondes)...
set /a count=0

:wait_loop
timeout /t 5 /nobreak >nul
docker info >nul 2>&1
if %ERRORLEVEL% equ 0 goto :docker_ok

set /a count+=1
echo   Attente... (%count%/18)
if %count% lss 18 goto :wait_loop

echo.
echo ========================================
echo    ERREUR: Docker n'a pas demarre
echo ========================================
echo.
echo Veuillez demarrer Docker Desktop manuellement
echo puis relancer ce script.
echo.
pause
popd
exit /b 1

:docker_ok
echo Docker est operationnel!
echo.

echo [1/3] Demarrage des services Docker...
docker-compose up -d

if %ERRORLEVEL% neq 0 (
    echo Erreur lors du demarrage de Docker Compose
    pause
    popd
    exit /b 1
)

echo [2/3] Attente du demarrage des services (15 secondes)...
timeout /t 15 /nobreak >nul

echo [3/3] Ouverture du navigateur en mode plein ecran...
echo.

REM Detecter Chrome
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    echo Utilisation de Chrome
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --kiosk --disable-infobars "http://localhost:8080"
    goto :launched
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    echo Utilisation de Chrome
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --kiosk --disable-infobars "http://localhost:8080"
    goto :launched
)
if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    echo Utilisation de Chrome
    start "" "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" --kiosk --disable-infobars "http://localhost:8080"
    goto :launched
)

REM Detecter Edge
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    echo Utilisation de Edge
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --kiosk --disable-infobars "http://localhost:8080"
    goto :launched
)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    echo Utilisation de Edge
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --kiosk --disable-infobars "http://localhost:8080"
    goto :launched
)

REM Fallback - ouvrir avec le navigateur par defaut
echo Ouverture avec le navigateur par defaut...
start http://localhost:8080

:launched
echo.
echo ========================================
echo    Application lancee avec succes!
echo ========================================
echo.
echo Pour quitter le mode plein ecran: F11 ou Alt+F4
echo Pour arreter les services: scripts\stop-app.bat
echo.
popd
pause