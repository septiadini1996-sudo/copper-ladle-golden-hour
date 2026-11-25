// Headless smoke test over the DevTools protocol: boot the real game, walk the
// screens with synthesized clicks, play the first cooking actions, and fail on any
// console error, page exception, or blank canvas.
import { spawn } from 'node:child_process';

const PORT = 8178;
const DEBUG = 9334;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = spawn('node', ['serve.ts'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
const { homedir } = await import('node:os');
const { join } = await import('node:path');
const SHELL = join(homedir(), '.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell');
const chrome = spawn(SHELL, [
  '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  '--window-size=1280,800', `--remote-debugging-port=${DEBUG}`, 'about:blank',
], { stdio: 'ignore' });

const problems = [];
try {
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
  ws.addEventListener('message', (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); }
    if (msg.method === 'Runtime.exceptionThrown') {
      problems.push(`exception: ${msg.params.exceptionDetails.text} ${msg.params.exceptionDetails.exception?.description || ''}`);
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      problems.push(`console.error: ${msg.params.args.map((a) => a.value || a.description || '').join(' ')}`);
    }
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      problems.push(`log: ${msg.params.entry.text}`);
    }
  });
  const send = (method, params = {}) => new Promise((resolve) => {
    const id = ++msgId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) problems.push(`evaluate failed: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`);
    return r.result && r.result.value;
  };
  const click = (gx, gy) => evaluate(`(() => {
    const c = document.getElementById('game');
    const r = c.getBoundingClientRect();
    const x = r.left + ${gx} * r.width / 1280;
    const y = r.top + ${gy} * r.height / 800;
    c.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, bubbles: true }));
    return true;
  })()`);
  const variety = () => evaluate(`(() => {
    const c = document.getElementById('game');
    const o = document.createElement('canvas');
    o.width = 160; o.height = 100;
    const g = o.getContext('2d');
    g.drawImage(c, 0, 0, 160, 100);
    const d = g.getImageData(0, 0, 160, 100).data;
    const seen = new Set();
    for (let i = 0; i < d.length; i += 16) seen.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
    return seen.size;
  })()`);
  const screenName = () => evaluate(`document.title`);

  await send('Runtime.enable');
  await send('Log.enable');
  await send('Page.enable');
  for (let i = 0; i < 40; i++) {
    try { const r = await fetch(`http://localhost:${PORT}/`); if (r.ok) break; } catch { /* server not up yet */ }
    await sleep(150);
  }
  await send('Page.navigate', { url: `http://localhost:${PORT}/` });
  for (let i = 0; i < 30; i++) {
    if (await evaluate(`!!document.getElementById('game')`)) break;
    await sleep(200);
  }
  await sleep(1200);

  const steps = [];
  const check = async (label) => {
    const v = await variety();
    steps.push(`${label}: ${v} colours`);
    if (v < 40) problems.push(`${label} looks blank (${v} colours)`);
  };
  await check('title');
  await click(562, 476); await sleep(500); await check('how-to');
  await click(115, 759); await sleep(400);
  await click(718, 476); await sleep(500); await check('recipe book');
  await click(115, 759); await sleep(400);
  await click(562, 530); await sleep(500); await check('trophies');
  await click(115, 759); await sleep(400);
  await click(640, 414); await sleep(600); await check('stage ladder');
  await click(130, 640); await sleep(600); await check('story (day 1)');
  await click(700, 539); await sleep(500); await check('day intro');
  await click(640, 583); await sleep(1200); await check('service');
  // play: pick the first pantry ingredient, tap a station, wait, tap around the kitchen
  await click(60, 612); await sleep(200);
  await click(262, 380); await sleep(200);
  await click(120, 612); await sleep(200);
  await click(100, 380); await sleep(2500);
  await click(150, 300); await sleep(300); // select the guest
  await check('service after actions');
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`);
  await sleep(500); await check('pause');
  await click(640, 369); await sleep(400); // resume
  await click(1232, 28); await sleep(600); await check('back at ladder');
  await screenName();

  console.log(steps.join('\n'));
  if (problems.length) {
    console.log('PROBLEMS:\n' + problems.join('\n'));
    process.exitCode = 1;
  } else {
    console.log('SMOKE OK — no console errors, no exceptions, every screen painted.');
  }
  ws.close();
} finally {
  chrome.kill();
  server.kill();
}
