@echo off
cd /d "%~dp0"
taskkill /F /IM BloodyRoar3.exe >nul 2>&1
taskkill /F /IM ps2run.exe >nul 2>&1
taskkill /F /IM muttgrine_br3.exe >nul 2>&1
timeout /t 1 >nul
call Play.bat
