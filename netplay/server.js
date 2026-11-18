// BR3 Netplay Server — Muttgrine Studios
// Combined signaling + relay + LAN discovery server
// Runs as a background service for both online and LAN play
//
// Usage:
//   node server.js                    — default (port 7878, LAN broadcast on 7879)
//   node server.js --port 9000        — custom port
//   node server.js --lan-only         — no internet rooms, LAN only
//   node server.js --online-only      — no LAN broadcast
//   node server.js --daemon           — suppress console output (background mode)

const WebSocket = require('ws');
const dgram = require('dgram');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Parse args
const args = process.argv.slice(2);
const getArg = (name, def) => {
    const idx = args.indexOf(name);
    return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : def;
};
const hasFlag = (name) => args.includes(name);

const WS_PORT = parseInt(getArg('--port', '7878'));
const LAN_PORT = WS_PORT + 1;
const LAN_ONLY = hasFlag('--lan-only');
const ONLINE_ONLY = hasFlag('--online-only');
const DAEMON = hasFlag('--daemon');
const LOG_FILE = getArg('--log', null);

// Logging
let logStream = null;
if (LOG_FILE) {
    logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
}

function log(...args) {
    const ts = new Date().toISOString();
    const line = `[${ts}] ${args.join(' ')}`;
    if (!DAEMON) console.log(line);
    if (logStream) logStream.write(line + '\n');
}

// ==================== Room Management ====================

const rooms = new Map();
let roomCounter = 0;

function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'BR3-';
    for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
}

function getRoomList() {
    const list = [];
    for (const [code, room] of rooms) {
        list.push({
            code,
            name: room.name || code,
            players: (room.host ? 1 : 0) + (room.guest ? 1 : 0),
            max: 2,
            status: room.guest ? 'playing' : 'waiting',
            lan: room.lan || false
        });
    }
    return list;
}

function cleanupRoom(code) {
    const room = rooms.get(code);
    if (!room) return;
    if (room.host) { try { room.host.close(); } catch(e) {} }
    if (room.guest) { try { room.guest.close(); } catch(e) {} }
    rooms.delete(code);
    log(`[room] ${code} destroyed`);
}

// Cleanup stale rooms every 60 seconds
setInterval(() => {
    const now = Date.now();
    for (const [code, room] of rooms) {
        if (now - room.lastActivity > 300000) { // 5 minutes inactive
            log(`[room] ${code} expired (inactive)`);
            cleanupRoom(code);
        }
    }
}, 60000);

// ==================== WebSocket Server ====================

const wss = new WebSocket.Server({ port: WS_PORT });

wss.on('connection', (ws, req) => {
    let playerRoom = null;
    let playerRole = null;
    const remoteAddr = req.socket.remoteAddress;
    log(`[ws] connection from ${remoteAddr}`);

    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', (raw) => {
        try {
            const msg = JSON.parse(raw);

            switch (msg.type) {
                case 'host': {
                    const code = generateCode();
                    rooms.set(code, {
                        host: ws,
                        guest: null,
                        name: msg.name || `Room ${++roomCounter}`,
                        lan: msg.lan || false,
                        lastActivity: Date.now(),
                        hostAddr: remoteAddr
                    });
                    playerRoom = code;
                    playerRole = 'host';
                    ws.send(JSON.stringify({ type: 'hosted', code }));
                    log(`[room] ${code} created by ${remoteAddr} (${msg.lan ? 'LAN' : 'online'})`);
                    break;
                }

                case 'join': {
                    const room = rooms.get(msg.code);
                    if (!room) {
                        ws.send(JSON.stringify({ type: 'error', msg: 'Room not found' }));
                        break;
                    }
                    if (room.guest) {
                        ws.send(JSON.stringify({ type: 'error', msg: 'Room full' }));
                        break;
                    }
                    room.guest = ws;
                    room.lastActivity = Date.now();
                    playerRoom = msg.code;
                    playerRole = 'guest';

                    ws.send(JSON.stringify({ type: 'joined', code: msg.code, player: 1 }));
                    room.host.send(JSON.stringify({ type: 'guest_joined', code: msg.code }));
                    log(`[room] ${msg.code} — guest joined from ${remoteAddr}`);
                    break;
                }

                case 'list': {
                    ws.send(JSON.stringify({ type: 'room_list', rooms: getRoomList() }));
                    break;
                }

                case 'input': {
                    // Fast path: relay binary input to other player
                    const room = rooms.get(playerRoom);
                    if (!room) break;
                    room.lastActivity = Date.now();
                    const target = playerRole === 'host' ? room.guest : room.host;
                    if (target && target.readyState === WebSocket.OPEN) {
                        target.send(raw); // forward raw — no parse/reserialize
                    }
                    break;
                }

                case 'ping': {
                    ws.send(JSON.stringify({ type: 'pong', t: msg.t }));
                    break;
                }

                case 'chat': {
                    const room = rooms.get(playerRoom);
                    if (!room) break;
                    room.lastActivity = Date.now();
                    const target = playerRole === 'host' ? room.guest : room.host;
                    if (target && target.readyState === WebSocket.OPEN) {
                        target.send(JSON.stringify({ type: 'chat', from: playerRole, msg: msg.msg }));
                    }
                    break;
                }

                case 'ready': {
                    const room = rooms.get(playerRoom);
                    if (!room) break;
                    room.lastActivity = Date.now();
                    const target = playerRole === 'host' ? room.guest : room.host;
                    if (target && target.readyState === WebSocket.OPEN) {
                        target.send(JSON.stringify({ type: 'player_ready', player: playerRole }));
                    }
                    break;
                }

                case 'start': {
                    // Host signals game start — both players begin frame sync
                    const room = rooms.get(playerRoom);
                    if (!room || playerRole !== 'host') break;
                    room.lastActivity = Date.now();
                    const startMsg = JSON.stringify({ type: 'game_start', delay: msg.delay || 3 });
                    ws.send(startMsg);
                    if (room.guest && room.guest.readyState === WebSocket.OPEN) {
                        room.guest.send(startMsg);
                    }
                    log(`[room] ${playerRoom} — game started (delay=${msg.delay || 3})`);
                    break;
                }
            }
        } catch (e) {
            // Might be binary input data — try relay directly
            if (playerRoom) {
                const room = rooms.get(playerRoom);
                if (room) {
                    room.lastActivity = Date.now();
                    const target = playerRole === 'host' ? room.guest : room.host;
                    if (target && target.readyState === WebSocket.OPEN) {
                        target.send(raw);
                    }
                }
            }
        }
    });

    ws.on('close', () => {
        log(`[ws] disconnected ${remoteAddr} (${playerRole || 'unknown'} in ${playerRoom || 'no room'})`);
        if (playerRoom) {
            const room = rooms.get(playerRoom);
            if (room) {
                const other = playerRole === 'host' ? room.guest : room.host;
                if (other && other.readyState === WebSocket.OPEN) {
                    other.send(JSON.stringify({ type: 'peer_disconnected', player: playerRole }));
                }
                if (playerRole === 'host') {
                    cleanupRoom(playerRoom);
                } else {
                    room.guest = null;
                }
            }
        }
    });

    ws.on('error', (err) => {
        log(`[ws] error from ${remoteAddr}: ${err.message}`);
    });
});

// Keepalive ping every 30 seconds
setInterval(() => {
    wss.clients.forEach((ws) => {
        if (!ws.isAlive) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

// ==================== LAN Discovery (UDP Broadcast) ====================

let lanSocket = null;

if (!ONLINE_ONLY) {
    lanSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

    lanSocket.on('message', (msg, rinfo) => {
        try {
            const data = JSON.parse(msg.toString());
            if (data.type === 'br3_discover') {
                // Someone is looking for LAN games — send our room list
                const response = JSON.stringify({
                    type: 'br3_announce',
                    server: `ws://${getLocalIP()}:${WS_PORT}`,
                    rooms: getRoomList().filter(r => r.lan),
                    hostname: os.hostname()
                });
                lanSocket.send(response, rinfo.port, rinfo.address);
            }
        } catch (e) {}
    });

    lanSocket.on('error', (err) => {
        log(`[lan] UDP error: ${err.message}`);
    });

    lanSocket.bind(LAN_PORT, () => {
        lanSocket.setBroadcast(true);
        log(`[lan] discovery listening on UDP port ${LAN_PORT}`);
    });
}

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

// ==================== Status / Health ====================

// Write PID file for service management
const pidFile = path.join(__dirname, 'server.pid');
fs.writeFileSync(pidFile, process.pid.toString());
process.on('exit', () => { try { fs.unlinkSync(pidFile); } catch(e) {} });
process.on('SIGINT', () => { process.exit(0); });
process.on('SIGTERM', () => { process.exit(0); });

// ==================== Startup ====================

log(`=========================================`);
log(`  BR3 Netplay Server — Muttgrine Studios`);
log(`=========================================`);
log(`WebSocket:  ws://0.0.0.0:${WS_PORT}`);
log(`Local IP:   ${getLocalIP()}`);
if (!ONLINE_ONLY) log(`LAN Discovery: UDP port ${LAN_PORT}`);
if (LAN_ONLY) log(`Mode: LAN only`);
else if (ONLINE_ONLY) log(`Mode: Online only`);
else log(`Mode: LAN + Online`);
log(`PID: ${process.pid} (written to ${pidFile})`);
log(`Ready for connections.`);
