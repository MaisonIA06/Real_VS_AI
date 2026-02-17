@echo off
chcp 65001 >nul
title Real vs AI - Arret

echo ========================================
echo    Real vs AI - Arret des services
echo ========================================
echo.

REM Aller dans le dossier parent (ou se trouve docker-compose.yml)
pushd "%~dp0\.."

echo Arret des conteneurs Docker...
docker-compose down

echo.
echo ========================================
echo    Services arretes avec succes!
echo ========================================
echo.
popd
pause
