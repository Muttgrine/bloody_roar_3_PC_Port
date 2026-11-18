@echo off
:: BR3 Netplay Server — Background Mode
:: Runs the server hidden in the background, logs to server.log
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

:: Kill existing server if running
if exist server.pid (
    set /p PID=<server.pid
    taskkill /PID %PID% /F >nul 2>&1
    del server.pid >nul 2>&1
)

:: Start server in background (hidden window)
echo Starting BR3 Netplay Server in background...
start /B /MIN "BR3 Server" node server.js --daemon --log server.log %*
timeout /t 2 >nul

:: Verify it started
if exist server.pid (
    set /p PID=<server.pid
    echo Server running (PID: %PID%)
    echo Logs: %~dp0server.log
    echo Stop with: stop_server.bat
) else (
    echo ERROR: Server failed to start. Check server.log
)
