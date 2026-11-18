@echo off
:: Stop the BR3 Netplay Server
cd /d "%~dp0"

if not exist server.pid (
    echo Server is not running.
    exit /b 0
)

set /p PID=<server.pid
echo Stopping BR3 Netplay Server (PID: %PID%)...
taskkill /PID %PID% /F >nul 2>&1
del server.pid >nul 2>&1
echo Server stopped.
