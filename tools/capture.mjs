// Capture the four kit screenshots: serve the game, render each staged scene in
// headless Chromium at 1280×800, and grab JPEG frames over the DevTools protocol,
// stepping quality down until each file is under the 256 KiB cap.
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PORT = 8177;
const DEBUG = 9335;
const SHELL = join(homedir(), '.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = spawn('node', ['serve.ts'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
const chrome = spawn(SHELL, [
  '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--window-size=1280,800',
  `--remote-debugging-port=${DEBUG}`, 'about:blank',
], { stdio: 'ignore' });

try {
  for (let i = 0; i < 40; i++) {
    try { const r = await fetch(`http://localhost:${PORT}/`); if (r.ok) break; } catch { /* server not up yet */ }
    await sleep(150);
  }
  let wsUrl = null;
  for (let i = 0; i < 50 && !wsUrl; i++) {
    try {
      const targets = await (await fetch(`http://localhost:${DEBUG}/json/list`)).json();
      const page = targets.find((t) => t.type === 'page');
      if (page) wsUrl = page.webSocketDebuggerUrl;
    } catch { /* not up yet */ }
    if (!wsUrl) await sleep(150);
  }
  if (!wsUrl) throw new Error('no debug target');
  const ws = new WebSocket(wsUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let msgId = 0;
  const pending = new Map();
  const errors = [];
  ws.addEventListener('message', (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); }
    if (msg.method === 'Runtime.exceptionThrown') {
      errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    }
  });
  const send = (method, params = {}) => new Promise((resolve) => {
    const id = ++msgId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
  await send('Page.enable');
  await send('Runtime.enable');
  const evaluate = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    return r.result && r.result.value;
  };
  const painted = () => evaluate(`(() => {
    const c = document.getElementById('game');
    if (!c) return 0;
    const o = document.createElement('canvas');
    o.width = 80; o.height = 50;
    const g = o.getContext('2d');
    g.drawImage(c, 0, 0, 80, 50);
    const d = g.getImageData(0, 0, 80, 50).data;
    const seen = new Set();
    for (let i = 0; i < d.length; i += 16) seen.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
    return seen.size;
  })()`);
  await mkdir('screenshots', { recursive: true });
  const shots = JSON.parse(await readFile('shots.json', 'utf8'));
  for (const shot of shots) {
    await send('Page.navigate', { url: `http://localhost:${PORT}/${shot.query}` });
    for (let i = 0; i < 30; i++) {
      if ((await painted()) > 40) break;
      await sleep(200);
    }
    let quality = 88;
    for (;;) {
      const r = await send('Page.captureScreenshot', { format: 'jpeg', quality, fromSurface: true });
      const buf = Buffer.from(r.data, 'base64');
      if (buf.length <= 262144 || quality <= 45) {
        await writeFile(join('screenshots', shot.name), buf);
        console.log(`${shot.name}: ${buf.length} bytes (jpeg q=${quality})${buf.length <= 262144 ? ' OK' : ' OVER CAP!'}`);
        break;
      }
      quality -= 12;
    }
  }
  if (errors.length) console.log('PAGE ERRORS:\n' + errors.join('\n'));
  ws.close();
} finally {
  chrome.kill();
  server.kill();
}
