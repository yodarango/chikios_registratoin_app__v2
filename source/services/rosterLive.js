import crypto from 'node:crypto';
import cookieParser from 'cookie-parser';
import { getAuthenticatedUser } from '../auth/getAuthenticatedUser.js';

// Notifications carry no child information; clients fetch the current roster over HTTPS.
const sockets = new Set();
const streams = new Set();
const payload = JSON.stringify({ type: 'roster_changed' });
const parseCookies = cookieParser();

function frame(opcode, value = Buffer.alloc(0)) {
  const data = Buffer.isBuffer(value) ? value : Buffer.from(value);
  if (data.length > 125) throw new Error('Frame too large');
  return Buffer.concat([Buffer.from([0x80 | opcode, data.length]), data]);
}

async function isAuthorized(token) {
  try { return (await getAuthenticatedUser(token))?.type === 'admin'; } catch { return false; }
}

export async function notifyRosterChanged() {
  for (const client of sockets) {
    if (!await isAuthorized(client.token)) { client.socket.destroy(); continue; }
    try { if (client.socket.writableLength > 65536) client.socket.destroy(); else client.socket.write(frame(1, payload)); } catch { client.socket.destroy(); }
  }
  for (const client of streams) {
    if (!await isAuthorized(client.token)) { client.res.end(); continue; }
    try { client.res.write(`data: ${payload}\n\n`); } catch { client.res.end(); }
  }
}

export function rosterEventStream(req, res) {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();
  res.write(': connected\n\n');
  const client = { res, token: req.cookies.authorization };
  streams.add(client);
  const timer = setInterval(async () => {
    if (!await isAuthorized(client.token)) return res.end();
    res.write(': heartbeat\n\n');
  }, 25000);
  req.on('close', () => { clearInterval(timer); streams.delete(client); });
}

// A deliberately read-only WebSocket: the browser sends no application frames.
export function attachRosterWebSocket(server) {
  server.on('upgrade', (req, socket, head) => {
    const reject = () => socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');
    socket.on('error', () => socket.destroy());
    if (req.url !== '/admin/live' || req.method !== 'GET' || req.headers.upgrade?.toLowerCase() !== 'websocket' || !req.headers.connection?.toLowerCase().split(/\s*,\s*/).includes('upgrade') || req.headers['sec-websocket-version'] !== '13') return reject();
    const key = req.headers['sec-websocket-key'];
    if (typeof key !== 'string' || !/^[A-Za-z0-9+/]{22}==$/.test(key)) return reject();
    const scheme = req.headers['x-forwarded-proto']?.split(',')[0].trim() || (req.socket.encrypted ? 'https' : 'http');
    if (!['http', 'https'].includes(scheme) || req.headers.origin !== `${scheme}://${req.headers.host}`) return reject();
    parseCookies(req, {}, async () => {
      const token = req.cookies?.authorization;
      if (!await isAuthorized(token) || socket.destroyed) return reject();
      const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
      socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
      const client = { socket, token, alive: true };
      socket.setTimeout(90000, () => socket.destroy());
      sockets.add(client);
      let buffered = Buffer.alloc(0);
      const read = (chunk) => {
        if (buffered.length + chunk.length > 8192) return socket.destroy();
        buffered = Buffer.concat([buffered, chunk]);
        while (buffered.length >= 2) {
          const first = buffered[0], second = buffered[1], size = second & 0x7f;
          // Only masked, unfragmented control frames (close, ping, pong) are supported.
          if ((first & 0xf0) !== 0x80 || !(second & 0x80) || size > 125 || ![8, 9, 10].includes(first & 0x0f)) return socket.destroy();
          if (buffered.length < size + 6) return;
          const mask = buffered.subarray(2, 6), body = Buffer.from(buffered.subarray(6, 6 + size));
          for (let i = 0; i < body.length; i++) body[i] ^= mask[i % 4];
          buffered = buffered.subarray(6 + size);
          const opcode = first & 0x0f;
          if (opcode === 8) { socket.end(frame(8)); return; }
          if (opcode === 9) socket.write(frame(10, body));
          if (opcode === 10) client.alive = true;
        }
      };
      socket.on('data', read);
      socket.on('close', () => sockets.delete(client));
      if (head.length) read(head);
    });
  });
  const heartbeat = setInterval(async () => {
    for (const client of sockets) {
      if (!client.alive || !await isAuthorized(client.token)) { client.socket.destroy(); continue; }
      client.alive = false;
      try { client.socket.write(frame(9)); } catch { client.socket.destroy(); }
    }
  }, 25000);
  heartbeat.unref();
  server.on('close', () => { clearInterval(heartbeat); for (const client of sockets) client.socket.destroy(); for (const client of streams) client.res.end(); });
}