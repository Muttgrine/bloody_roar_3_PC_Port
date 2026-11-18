@echo off
title Bloody Roar 3 ^| Muttgrine Studios
cd /d "%~dp0"

:: Check for ISO
if not exist "games\br3\disc.iso" (
    echo.
    echo   ==========================================
    echo   Game disc not found!
    echo.
    echo   Put your Bloody Roar 3 ISO file here:
    echo      games\br3\disc.iso
    echo   ==========================================
    echo.
    pause
    exit /b 1
)

:: Force NVIDIA GPU (instead of Intel integrated)
set SHIM_MCCOMPAT=0x800000001
set __NV_PRIME_RENDER_OFFLOAD=1
set __GLX_VENDOR_LIBRARY_NAME=nvidia

:: GPU settings — use Vulkan on NVIDIA (faster than D3D12 on discrete GPUs)
set PS2_GPU_BACKEND=vulkan
set PS2_GPU_SUBMIT_THREAD=1

:: Visual enhancements
set PS2_TRUE_COLOR=1
set PS2_MIPMAP=1

:: Launch with Muttgrine splash, fall back to game directly
if exist muttgrine_br3.exe (
    start "" /HIGH muttgrine_br3.exe
) else (
    start "" /HIGH BloodyRoar3.exe --disc games\br3\disc.iso --window --game-dir games\br3 --memcard games\br3\br3.ps2 --widescreen --patches games\br3\patches\widescreen.pnach
)
