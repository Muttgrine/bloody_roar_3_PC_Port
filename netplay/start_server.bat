@echo off
title BR3 Netplay Server — Muttgrine Studios
cd /d "%~dp0"

:: Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)

:: Install dependencies if needed
if not exist node_modules\ws (
    echo Installing dependencies...
    npm install
)

:: Start server (foreground with logs)
echo Starting BR3 Netplay Server...
node server.js --log server.log %*
