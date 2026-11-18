# Bloody Roar 3 — Native PC Port

![Muttgrine Studios](https://img.shields.io/badge/By-Muttgrine%20Studios-red?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Windows_x64-0078D6?style=for-the-badge&logo=windows)
![Backend](https://img.shields.io/badge/Backend-Vulkan%20%7C%20D3D12-red?style=for-the-badge)

A native PC port of **Bloody Roar 3** (PS2) by Muttgrine Studios. No emulator — the game runs as a standalone `.exe` with full 3D graphics, widescreen, HD intro cinematics, and controller support.

> **This project contains no copyrighted game data.** You must provide your own legally obtained PS2 disc image.

## Features

- **Native 60fps gameplay** — no emulation overhead
- **Widescreen 16:9** — fills your monitor
- **Resolution upscaling** — 1x native to 4x (2560x1792)
- **True color** — 32-bit output, no dithering
- **HD intro cinematics** — 1080p with audio (extracted and upscaled from disc)
- **Controller support** — Xbox, PlayStation, Switch (automatic via SDL2)
- **Keyboard controls** — full button mapping
- **Memory card saves** — virtual .ps2 file, persists between sessions
- **CRT filter** — optional scanlines, curvature, phosphor mask
- **In-game menu (F1)** — resolution, picture look, fullscreen, keys, netplay, save/load
- **Muttgrine Studios splash** — custom launcher with logo animation
- **Netplay lobby** — online/LAN multiplayer (in progress)

## Quick Start

1. Place your Bloody Roar 3 (USA) PS2 disc image as `games/br3/disc.iso`
2. Double-click `Play.bat`
3. Fight!

## Setup

### Requirements
- Windows 10/11 64-bit
- GPU with Vulkan or Direct3D 12 support
- Your own Bloody Roar 3 (USA, SLUS-20212) PS2 disc image

### HD Intro Videos (Optional)
Place the pre-converted 1080p intro videos in the `fmv/` folder:
- `fmv/ACT.mp4` — Activision logo
- `fmv/HUDSONCI.mp4` — Hudson logo
- `fmv/BR.mp4` — BR3 intro cinematic
- `fmv/END.mp4` — Ending cinematic

These can be generated from your disc using `tools/pss_extract.py` (see below).

### ffmpeg/ffplay
For HD intro audio playback, install [ffmpeg](https://www.gyan.dev/ffmpeg/builds/) and ensure `ffplay.exe` is in your PATH or this folder.

## Controls

### Keyboard
| Key | Action |
|-----|--------|
| Arrow Keys | Move |
| X | Cross (confirm/attack) |
| Z | Square |
| C | Circle |
| V | Triangle |
| Q / E | L1 / R1 |
| 1 / 3 | L2 / R2 |
| Enter | Start |
| Right Shift | Select |
| F1 | Quick menu |
| F2 | Picture look |
| F5 | Quick save |
| F8 | Quick load |
| F11 | Fullscreen |

### Controller
Xbox, PlayStation, and Switch controllers work automatically via SDL2.

## In-Game Menu (F1)

Press F1 during gameplay to access:
- **Resolution** — 1x, 2x, 3x, 4x
- **Picture look** — Crisp, Soft, Sharp (with/without smooth edges)
- **Text and menus** — Soft, Sharp, Sharpest
- **Full screen** — toggle
- **Show/Change keys** — rebind controls
- **Netplay Lobby** — host or join online matches
- **Quick save/load** — save states
- **Quit**

## Performance Tips

- Close Chrome, VS Code, and other heavy apps
- If you have NVIDIA + Intel GPUs, force NVIDIA:
  `Settings → Display → Graphics → Add BloodyRoar3.exe → High Performance`
- Resolution 1x is fastest; 2x-4x for sharper visuals

## Online Play

1. Start the server: `netplay/start_server.bat`
2. In-game: F1 → Netplay Lobby
3. Host creates a room, shares the code
4. Guest joins with the code
5. Fight!

## PS2 FMV Extraction Tool

`tools/pss_extract.py` extracts video and audio from PS2 `.PSS` files. Works with **any PS2 game**.

```bash
# Extract
python tools/pss_extract.py MOVIE.PSS video.m2v audio.wav

# Convert to 1080p MP4 with audio
ffmpeg -y -i video.m2v -i audio.wav \
    -vf "scale=1920:1080:flags=lanczos" \
    -c:v libx264 -crf 20 -c:a aac -b:a 192k -shortest \
    movie_hd.mp4
```

## Built With

- [ps2-native-recomp](https://github.com/exoteric33/ps2-native-recomp) — PS2 static recompilation toolkit
- [SDL2](https://www.libsdl.org/) — Window, input, audio
- [wgpu-native](https://github.com/gfx-rs/wgpu-native) — WebGPU rendering (Vulkan/D3D12)
- [llvm-mingw](https://github.com/mstorsjo/llvm-mingw) — Build toolchain

## Legal

This project contains no copyrighted game data. You must provide your own legally obtained copy of Bloody Roar 3. Bloody Roar is a trademark of Konami / Hudson Soft / Eighting. This is an unofficial fan project.

## Credits

Made with fun in mind by **Muttgrine Studios** 🐺
