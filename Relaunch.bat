@echo off
title Restarting Bloody Roar 3...
cd /d "%~dp0"
echo.
echo   Restarting Bloody Roar 3...
echo.
taskkill /F /IM BloodyRoar3.exe >nul 2>&1
taskkill /F /IM ps2run.exe >nul 2>&1
taskkill /F /IM muttgrine_br3.exe >nul 2>&1
taskkill /F /IM ffplay.exe >nul 2>&1
timeout /t 2 >nul
call Play.bat
