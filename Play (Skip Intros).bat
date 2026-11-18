@echo off
title Bloody Roar 3 ^| Muttgrine Studios (Skip Intros)
cd /d "%~dp0"

if not exist "games\br3\disc.iso" (
    echo   Put your Bloody Roar 3 ISO here: games\br3\disc.iso
    pause
    exit /b 1
)

set SHIM_MCCOMPAT=0x800000001
set __NV_PRIME_RENDER_OFFLOAD=1
set PS2_GPU_BACKEND=vulkan
set PS2_GPU_SUBMIT_THREAD=1
set PS2_TRUE_COLOR=1
set PS2_MIPMAP=1

:: Auto-press Start at frame 1 to skip all intro FMVs (saves CPU spike)
start "" /HIGH BloodyRoar3.exe --disc games\br3\disc.iso --window --game-dir games\br3 --memcard games\br3\br3.ps2 --widescreen --patches games\br3\patches\widescreen.pnach --press 1:start --press 60:start --press 120:start --press 180:start --press 240:start
