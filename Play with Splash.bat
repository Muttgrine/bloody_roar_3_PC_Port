@echo off
title Bloody Roar 3 ^| Muttgrine Studios
cd /d "%~dp0"

if not exist "games\br3\disc.iso" (
    echo.
    echo   Put your Bloody Roar 3 ISO here: games\br3\disc.iso
    echo.
    pause
    exit /b 1
)

set PS2_GPU_BACKEND=dx12
set PS2_GPU_SUBMIT_THREAD=1

if exist muttgrine_br3.exe (
    start "" /HIGH muttgrine_br3.exe
) else (
    echo   muttgrine_br3.exe not found, launching game directly...
    start "" /HIGH BloodyRoar3.exe --disc games\br3\disc.iso --window --game-dir games\br3 --memcard games\br3\br3.ps2
)
