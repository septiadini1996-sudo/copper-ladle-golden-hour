// The Copper Ladle — app shell: canvas boot, the screen state machine, pointer and
// keyboard input, the frame loop, sound triggered by the engine's event queue, the
// tutorial coach, confetti, and localStorage persistence. All rules live in engine.js;
// this file only presents them.

import {
  createGame, createDay, tick, startCook, addDirect, tapItem, useTray, trashItem,
  serveDish, servePhone, finishDay, buyUpgrade, buyDecor,
} from './engine.js';
import { STORY, ING, UPGRADE, DECOR_BY_ID, ACHIEVEMENTS } from './data.js';
import { draw } from './render.js';
import { ingredientPainter, drinkPainter } from './art.js';
import * as audio from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const SAVE_KEY = 'copper-ladle-v7-save';
const MUTE_KEY = 'copper-ladle-v7-muted';

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const g = JSON.parse(raw);
      if (g && g.levels && g.stars) {
        if (!Array.isArray(g.seenStory)) g.seenStory = [];
        return g;
      }
    }
  } catch { /* fresh start */ }
  const g = createGame(1 + ((Math.random() * 999983) | 0));
  g.seenStory = [];
  return g;
}
function saveGame() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S.game)); } catch { /* private mode */ }
}

const S = {
  screen: 'title',
  t: 0,
  game: loadGame(),
  day: null,
  regions: [],
  popups: [],
  confetti: [],
  toast: null,
  itemGet: null,
  result: null,
  summaryT: 0,
  pendingDay: 1,
  storyScene: null,
  storyQueue: [],
  storyLast: false,
  held: null,
  lastTapped: null,
  tutorial: null,
  muted: false,
  mouse: { x: 0, y: 0 },
  frozen: false,
  seatOf: new Map(),
  dayStats: { perfects: 0, bestCombo: 0 },
  starsPlayed: 0,
  prevCombo: 0,
};
try { S.muted = localStorage.getItem(MUTE_KEY) === '1'; } catch { /* ignore */ }
audio.setMuted(S.muted);

const MUSIC_FOR = {
  title: 'calm', ladder: 'calm', story: 'calm', intro: 'calm', howto: 'calm',
  recipes: 'calm', achievements: 'calm', summary: 'calm', service: 'lively',
  pause: 'calm', shop: 'mellow',
};
function setScreen(name, { whoosh = true } = {}) {
  S.screen = name;
  if (whoosh) audio.sfx.whoosh();
  audio.startMusic(MUSIC_FOR[name] || 'calm');
}
function toast(text) { S.toast = { text, age: 0 }; }
function burstConfetti(n, big = false) {
  const colors = ['#f4c542', '#e74c3c', '#7ed37e', '#7fb3d5', '#f0a0c0', '#fdf3e0'];
  for (let i = 0; i < n; i++) {
    S.confetti.push({
      x: 340 + Math.random() * 600, y: -10 - Math.random() * 130,
      vx: (Math.random() - 0.5) * 30, vy: 60 + Math.random() * (big ? 130 : 90),
      rot: Math.random() * 6.3, vr: (Math.random() - 0.5) * 7,
      color: colors[i % colors.length], age: 0,
    });
  }
}

// ------------------------------------------------------------------ day flow
function maybeStory(dayNum) {
  if (dayNum === 1 && !S.game.seenStory.includes('intro')) return 'intro';
  if (dayNum === 7 && !S.game.seenStory.includes('mid')) return 'mid';
  if (dayNum === 12 && !S.game.seenStory.includes('final')) return 'final';
  return null;
}
function openStage(dayNum) {
  S.pendingDay = dayNum;
  const sceneId = maybeStory(dayNum);
  if (sceneId) {
    S.storyQueue = STORY[sceneId].map(([speaker, text]) => ({ speaker, text }));
    S.game.seenStory.push(sceneId);
    saveGame();
    showStory();
  } else {
    setScreen('intro');
  }
}
function showStory() {
  S.storyScene = S.storyQueue[0];
  S.storyLast = S.storyQueue.length === 1;
  setScreen('story');
}
function beginDay(day) {
  S.day = day;
  S.seatOf = new Map();
  S.held = null;
  S.lastTapped = null;
  S.dayStats = { perfects: 0, bestCombo: 0 };
  S.prevCombo = 0;
  S.tutorial = !day.endless && day.num === 1 && !S.game.tutorialDone ? { step: 0, done: false } : null;
  setScreen('service');
  toast(day.endless ? `Endless wave ${day.wave} — goal $${day.goal}!` : `Day ${day.num} — goal $${day.goal}!`);
}
function startDay(dayNum) { beginDay(createDay(S.game, dayNum)); }
function startEndless(wave) { beginDay(createDay(S.game, 12, { endless: true, wave })); }
function endDay() {
  const day = S.day;
  const fin = finishDay(S.game, day);
  S.result = {
    day: day.num, wave: day.wave, endless: day.endless,
    goal: day.goal, earned: day.earned, served: day.served,
    perfects: S.dayStats.perfects, bestCombo: S.dayStats.bestCombo,
    walkouts: day.lost, stars: fin.stars, won: fin.won,
    campaignWon: !day.endless && day.num === 12 && fin.won && S.game.campaignWon,
  };
  S.summaryT = 0;
  S.starsPlayed = 0;
  S.confetti = [];
  if (fin.won) {
    burstConfetti(S.result.campaignWon ? 170 : 95, S.result.campaignWon);
    audio.stingVictory();
  } else {
    audio.stingDefeat();
  }
  if (S.tutorial) { S.game.tutorialDone = true; S.tutorial = null; }
  saveGame();
  setScreen('summary', { whoosh: false });
}

// ------------------------------------------------------------------ engine events → sound & coaching
function drainEvents() {
  const day = S.day;
  if (!day) return;
  for (const ev of day.events.splice(0)) {
    switch (ev.type) {
      case 'place':
        audio.cookSound(ev.station);
        audio.sfx.thunk();
        if (S.tutorial && S.tutorial.step === 1) S.tutorial.step = 2;
        break;
      case 'flip': audio.cookSound(ev.station); break;
      case 'perfect-enter':
        audio.sfx.perfect();
        if (S.tutorial && S.tutorial.step === 2) S.tutorial.step = 3;
        break;
      case 'plate':
        audio.sfx.tap();
        if (S.tutorial && S.tutorial.step === 3) S.tutorial.step = 4;
        break;
      case 'tray': audio.sfx.pop(); break;
      case 'denied': audio.sfx.error(); break;
      case 'drink': audio.sfx.coin(); break;
      case 'drink-boost': audio.sfx.pop(); toast('A drink on the house: patience +20%!'); break;
      case 'serve':
        audio.sfx.bell();
        audio.sfx.coin();
        if (ev.perfect) { audio.sfx.perfectServe(); S.dayStats.perfects += 1; }
        if (S.tutorial && S.tutorial.step === 4) { S.tutorial.done = true; S.game.tutorialDone = true; saveGame(); }
        break;
      case 'serve-phone': audio.sfx.bell(); audio.sfx.coin(); break;
      case 'fever': audio.sfx.fever(); toast('FEVER! Cooking ×2 speed, payouts ×2!'); break;
      case 'phone-ring': audio.sfx.ring(); toast('📞 A phone order came in!'); break;
      case 'phone-expire': toast('The phone order expired — no penalty.'); break;
      case 'walkout': audio.sfx.walkout(); audio.sfx.comboBreak(); break;
      case 'combo-break': audio.sfx.comboBreak(); break;
      case 'loyalty': audio.sfx.coin(); toast(`♥ Marco's loyalty bonus: +$${ev.amount}!`); break;
      case 'achievement': {
        audio.sfx.itemGet();
        const a = ACHIEVEMENTS.find((x) => x.id === ev.id);
        if (a) toast(`🏆 Trophy unlocked: ${a.name}!`);
        break;
      }
      case 'helper': audio.sfx.helper(); break;
      case 'trash': audio.sfx.crumple(); break;
      default: break;
    }
  }
}

// ------------------------------------------------------------------ input
function dispatch(region) {
  const { id, data } = region;
  const day = S.day;
  switch (id) {
    case 'play': setScreen('ladder'); break;
    case 'back': setScreen(S.screen === 'intro' ? 'ladder' : 'title'); break;
    case 'howto': setScreen('howto'); break;
    case 'recipes': setScreen('recipes'); break;
    case 'achievements': setScreen('achievements'); break;
    case 'endless': startEndless(1); break;
    case 'diff-relaxed': S.game.difficulty = 'relaxed'; saveGame(); audio.sfx.blip(); break;
    case 'diff-normal': S.game.difficulty = 'normal'; saveGame(); audio.sfx.blip(); break;
    case 'mute': case 'mute2': toggleMute(); break;
    case 'stage': openStage(data); break;
    case 'story-next':
      audio.sfx.blip();
      S.storyQueue.shift();
      if (S.storyQueue.length) showStory(); else setScreen('intro');
      break;
    case 'story-skip': S.storyQueue = []; setScreen('intro'); break;
    case 'startday': startDay(S.pendingDay); break;
    case 'pause': setScreen('pause'); break;
    case 'resume': setScreen('service'); break;
    case 'restart': if (day) { day.endless ? startEndless(day.wave) : startDay(day.num); } break;
    case 'quitday': S.day = null; setScreen('ladder'); break;
    case 'guest': if (day) { day.selected = data; audio.sfx.blip(); } break;
    case 'phone': if (day) { day.selected = 'phone'; audio.sfx.blip(); } break;
    case 'pantry': {
      S.held = data;
      audio.sfx.pop();
      if (S.tutorial && S.tutorial.step === 0) S.tutorial.step = 1;
      break;
    }
    case 'station': {
      if (!day || !S.held) break;
      if (S.held.kind === 'ing' && ING[S.held.id].process === 'none') {
        if (addDirect(day, S.held.id)) S.held = null;
      } else if (startCook(day, S.game, S.held.id)) {
        S.held = null;
      }
      break;
    }
    case 'item': {
      if (!day) break;
      if (!tapItem(day, S.game, data)) S.lastTapped = { kind: 'station', uid: data };
      else S.lastTapped = null;
      break;
    }
    case 'tray': {
      if (!day) break;
      if (!useTray(day, data)) S.lastTapped = { kind: 'tray', idx: data };
      else S.lastTapped = null;
      break;
    }
    case 'serve': {
      if (!day) break;
      if (day.selected === 'phone') servePhone(day, S.game);
      else serveDish(day, S.game);
      break;
    }
    case 'trash': {
      if (!day) break;
      let done = false;
      if (S.lastTapped && S.lastTapped.kind === 'station') done = trashItem(day, S.lastTapped.uid);
      else if (S.lastTapped && S.lastTapped.kind === 'tray' && day.tray[S.lastTapped.idx]) {
        day.tray.splice(S.lastTapped.idx, 1);
        audio.sfx.crumple();
        done = true;
      } else {
        const target = day.selected === 'phone' ? day.phone : day.customers.find((c) => c.uid === day.selected);
        if (target && target.dish.length) {
          target.dish = [];
          target.dishQuality = [];
          audio.sfx.crumple();
          done = true;
        }
      }
      if (done) S.lastTapped = null;
      else audio.sfx.error();
      break;
    }
    case 'plating': audio.sfx.blip(); break;
    case 'tutskip': if (S.tutorial) { S.tutorial.done = true; S.game.tutorialDone = true; saveGame(); } break;
    case 'buy': {
      if (buyUpgrade(S.game, data)) {
        const u = UPGRADE[data];
        audio.sfx.buy();
        audio.sfx.itemGet();
        S.itemGet = { icon: u.icon, name: `${u.name} — Lv ${S.game.levels[data]}`, effect: u.text(S.game.levels[data]), age: 0 };
        saveGame();
      } else audio.sfx.error();
      break;
    }
    case 'buydecor': {
      if (buyDecor(S.game, data)) {
        const d = DECOR_BY_ID[data];
        audio.sfx.buy();
        audio.sfx.itemGet();
        S.itemGet = { icon: d.icon, name: d.name, effect: d.text, age: 0 };
        saveGame();
      } else audio.sfx.error();
      break;
    }
    case 'toshop': setScreen('shop'); break;
    case 'shopdone': setScreen('ladder'); break;
    case 'tomap': S.day = null; setScreen('ladder'); break;
    case 'nextwave': startEndless(S.result.wave + 1); break;
    case 'retry':
      if (S.result.endless) startEndless(S.result.wave);
      else { S.pendingDay = S.result.day; setScreen('intro'); }
      break;
    default: break;
  }
}
function toggleMute() {
  S.muted = !S.muted;
  audio.setMuted(S.muted);
  try { localStorage.setItem(MUTE_KEY, S.muted ? '1' : '0'); } catch { /* ignore */ }
}

canvas.addEventListener('pointerdown', (e) => {
  audio.unlockAudio();
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  for (let i = S.regions.length - 1; i >= 0; i--) {
    const r = S.regions[i];
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) { dispatch(r); return; }
  }
  if (S.screen === 'service') S.held = null;
});
canvas.addEventListener('pointermove', (e) => {
  const rect = canvas.getBoundingClientRect();
  S.mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
  S.mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
});
window.addEventListener('keydown', (e) => {
  audio.unlockAudio();
  if (e.key === 'Escape') {
    if (S.screen === 'service') setScreen('pause');
    else if (S.screen === 'pause') setScreen('service');
    else if (['howto', 'recipes', 'achievements'].includes(S.screen)) setScreen('title');
  } else if (e.key === 'm' || e.key === 'M') toggleMute();
  else if ((e.key === 's' || e.key === 'S') && S.screen === 'service') dispatch({ id: 'serve' });
});

// ------------------------------------------------------------------ frame loop
let last = performance.now();
function frame(nowMs) {
  requestAnimationFrame(frame);
  let dt = Math.min(0.05, (nowMs - last) / 1000);
  last = nowMs;
  if (S.frozen) dt = 0;
  if (dt > 0) {
    S.t += dt;
    for (const p of S.popups) p.age += dt;
    S.popups = S.popups.filter((p) => p.age < 1.5);
    if (S.toast) { S.toast.age += dt; if (S.toast.age > 2.2) S.toast = null; }
    if (S.itemGet) { S.itemGet.age += dt; if (S.itemGet.age > 1.6) S.itemGet = null; }
    for (const c of S.confetti) { c.age += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.rot += c.vr * dt; }
    S.confetti = S.confetti.filter((c) => c.age < 3.2 && c.y < 840);
    if (S.screen === 'summary' && S.result && S.result.won) {
      S.summaryT += dt;
      for (let i = 0; i < S.result.stars; i++) {
        if (S.summaryT > 0.35 + i * 0.45 && S.starsPlayed <= i) {
          audio.sfx.star(i);
          S.starsPlayed = i + 1;
        }
      }
    }
    if (S.screen === 'service' && S.day) {
      tick(S.day, S.game, dt);
      drainEvents();
      if (S.day.combo > S.prevCombo) audio.sfx.comboRise(S.day.combo);
      S.prevCombo = S.day.combo;
      S.dayStats.bestCombo = Math.max(S.dayStats.bestCombo, S.day.combo);
      if (S.day.over) endDay();
    }
  }
  draw(ctx, S);
  if (S.held && S.screen === 'service') {
    ctx.save();
    ctx.fillStyle = 'rgba(20,10,0,0.25)';
    ctx.beginPath(); ctx.ellipse(S.mouse.x, S.mouse.y + 16, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
    if (S.held.kind === 'ing') ingredientPainter(ctx, S.held.id, S.mouse.x, S.mouse.y, 38);
    else drinkPainter(ctx, S.held.id, S.mouse.x, S.mouse.y, 34);
    ctx.restore();
  }
}

// Screenshot staging (?shot=<scene>&seed=<n>) — used by the kit's capture flow.
const params = new URLSearchParams(location.search);
if (params.has('shot')) {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
  S.game = createGame(7);
  S.game.seenStory = ['intro', 'mid', 'final'];
  stageShot(S, params.get('shot'), Number(params.get('seed') || 7));
  S.frozen = true;
  audio.stopMusic();
}
requestAnimationFrame(frame);
