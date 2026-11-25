// All screens are drawn here on one canvas. The service scene is deliberately
// SPACIOUS: the counter runs the full width of the frame, the six appliances and the
// plating board stand spread along it with room around each, the guests stand behind
// it with comfortable spacing, and the furnished wall (window, shelves, jars, pass,
// clock, hanging pans) is laid out airy across the width — while everything stays
// grounded on ONE countertop line: appliances stand on it with soft contact shadows,
// guests are occluded by the counter front from the waist down.

import {
  ING, INGREDIENTS, DRINK, DRINKS, STATIONS, RECIPES, RECIPE, UPGRADES, DECOR, CUSTOMER,
  dishOfTheDay, unlockedRecipes,
} from './data.js';
import {
  nextStepOf, dishPrice, comboMult, itemQuality, starsFor, purse, totalStars, traySlots, targetOf,
} from './engine.js';
import { CONFIG, DAY_GOALS, DIFFICULTY } from './config.js';
import {
  shade, rr, ell, ingredientPainter, drinkPainter, drawDish, characterPainter, rosaPainter,
  catPainter, APPLIANCES, iconPainter, logoPainter,
} from './art.js';
import { CUE_MAP } from './audio.js';

export const W = 1280;
export const H = 800;
const COUNTER_Y = 430; // THE countertop line: everything in the kitchen stands on it
const SEAT_X = [150, 385, 620, 855, 1090];
const STATION_X = { prep: 100, grill: 262, stove: 424, oven: 754, fryer: 916, drinks: 1078 };
const PLATE_X = 592; // the plating board section of the same countertop
const STATION_W = 132;
const STATION_H = 104;
export const LAYOUT = { COUNTER_Y, SEAT_X, STATION_X, PLATE_X };

const DISPLAY = '"Trebuchet MS", Verdana, sans-serif';
const BODY = '"Segoe UI", Verdana, sans-serif';

// ------------------------------------------------------------------ text & panels
export function txt(ctx, text, x, y, size, color = '#fdf3e0', align = 'left', weight = 'bold', font = BODY) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}
export function heading(ctx, text, x, y, size, align = 'center') {
  ctx.save();
  ctx.font = `900 ${size}px ${DISPLAY}`;
  ctx.textAlign = align;
  ctx.lineWidth = size * 0.22;
  ctx.strokeStyle = '#2a1408';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;
  ctx.strokeText(text, x, y);
  const g = ctx.createLinearGradient(0, y - size, 0, y);
  g.addColorStop(0, '#f9e79f');
  g.addColorStop(0.55, '#f0b45a');
  g.addColorStop(1, '#d97f3e');
  ctx.fillStyle = g;
  ctx.fillText(text, x, y);
  ctx.restore();
}
function panel(ctx, x, y, w, h, fill = 'rgba(43,24,42,0.92)', border = '#c98d4b') {
  ctx.save();
  ctx.fillStyle = fill;
  rr(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 2.5;
  rr(ctx, x, y, w, h, 14);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  rr(ctx, x + 3, y + 3, w - 6, h * 0.4, 12);
  ctx.fill();
  ctx.restore();
}
function chip(ctx, x, y, w, h, fill, label, size = 14, color = '#fff') {
  ctx.save();
  ctx.fillStyle = fill;
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1.5;
  rr(ctx, x, y, w, h, h / 2);
  ctx.stroke();
  txt(ctx, label, x + w / 2, y + h / 2 + size * 0.36, size, color, 'center');
  ctx.restore();
}
function button(ctx, S, id, x, y, w, h, label, { fill = '#b3543f', size = 17, data = null, disabled = false } = {}) {
  ctx.save();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, disabled ? '#6b5a52' : shade(fill, 1.25));
  g.addColorStop(1, disabled ? '#4a3d38' : shade(fill, 0.8));
  ctx.fillStyle = g;
  rr(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = '#2a1408';
  ctx.lineWidth = 2.5;
  rr(ctx, x, y, w, h, 12);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  rr(ctx, x + 4, y + 3, w - 8, h * 0.42, 9);
  ctx.fill();
  txt(ctx, label, x + w / 2, y + h / 2 + size * 0.37, size, '#fff8ea', 'center', '900', DISPLAY);
  ctx.restore();
  if (!disabled) S.regions.push({ id, x, y, w, h, data });
}
function starShape(ctx, x, y, r, fill) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r * 0.48 : r;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(90,50,0,0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}
function starsRow(ctx, n, x, y, r, gap) {
  for (let i = 0; i < 3; i++) starShape(ctx, x + i * gap, y, r, i < n ? '#f4c542' : 'rgba(120,110,100,0.5)');
}
function progressBar(ctx, x, y, w, h, frac, fill, track = 'rgba(0,0,0,0.45)') {
  ctx.save();
  ctx.fillStyle = track;
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  if (frac > 0) {
    ctx.fillStyle = fill;
    rr(ctx, x, y, Math.max(h, w * Math.min(1, frac)), h, h / 2);
    ctx.fill();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ the diner room
function lampGlow(ctx, x, yTop, t) {
  const g = ctx.createRadialGradient(x, yTop + 120, 10, x, yTop + 120, 190);
  g.addColorStop(0, 'rgba(255,205,110,0.30)');
  g.addColorStop(1, 'rgba(255,205,110,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 190, yTop - 10, 380, 380);
  ctx.strokeStyle = '#3a2a18';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x, yTop); ctx.lineTo(x, yTop + 44); ctx.stroke();
  ctx.fillStyle = '#2e2119';
  ctx.beginPath(); ctx.moveTo(x - 30, yTop + 74); ctx.lineTo(x - 13, yTop + 42); ctx.lineTo(x + 13, yTop + 42); ctx.lineTo(x + 30, yTop + 74); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffd98a';
  ell(ctx, x, yTop + 76, 17, 6); ctx.fill();
}

function drawRoom(ctx, S, { withCounter = true } = {}) {
  const t = S.t;
  // wall: warm plum-plaster gradient with a subtle texture of dots
  const wg = ctx.createLinearGradient(0, 0, 0, COUNTER_Y + 120);
  wg.addColorStop(0, '#4a2c44');
  wg.addColorStop(0.7, '#5d3750');
  wg.addColorStop(1, '#6b4258');
  ctx.fillStyle = wg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  for (let i = 0; i < 130; i++) {
    const px = (i * 197) % W; const py = (i * 131) % 420;
    ctx.fillRect(px, py, 3, 3);
  }
  // evening window, far left — spread out with room around it
  ctx.save();
  ctx.fillStyle = '#1d2b4a';
  rr(ctx, 36, 84, 176, 168, 10); ctx.fill();
  ctx.fillStyle = '#f4e3b2'; ctx.beginPath(); ctx.arc(168, 122, 19, 0, Math.PI * 2); ctx.fill(); // moon
  ctx.fillStyle = '#fff8dc';
  for (const [sx, sy] of [[60, 110], [96, 150], [70, 200], [140, 190], [120, 100]]) { ctx.fillRect(sx, sy, 3, 3); }
  ctx.fillStyle = '#141f38';
  ctx.fillRect(36, 218, 176, 34);
  for (const bx of [52, 92, 140, 178]) ctx.fillRect(bx, 196, 22, 24);
  ctx.strokeStyle = '#8a5a24'; ctx.lineWidth = 7; rr(ctx, 36, 84, 176, 168, 10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(124, 84); ctx.lineTo(124, 252); ctx.stroke();
  ctx.restore();
  // shelf of stacked plates and bowls, centre-left, airy
  ctx.save();
  ctx.fillStyle = '#7c4a22'; rr(ctx, 292, 128, 268, 12, 5); ctx.fill();
  for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? '#eef3f5' : '#d9e4e8'; ell(ctx, 330 + i * 26, 124, 17, 5.5); ctx.fill(); }
  for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#7fb3d5', '#e5989b', '#a9cba0'][i]; ctx.beginPath(); ctx.arc(452 + i * 38, 120, 14, Math.PI * 0.1, Math.PI * 0.9); ctx.fill(); }
  ctx.fillStyle = '#8a5a24'; txt(ctx, 'FINE CHINA', 426, 162, 11, '#e8c48a', 'center');
  ctx.restore();
  // labelled jars shelf, centre-right
  ctx.save();
  ctx.fillStyle = '#7c4a22'; rr(ctx, 636, 128, 252, 12, 5); ctx.fill();
  const jarCols = ['#e67e22', '#c0392b', '#f1c40f', '#7cb35a', '#a9713a'];
  const jarNames = ['PAPRIKA', 'TOMATO', 'CORN', 'HERBS', 'HONEY'];
  jarCols.forEach((c, i) => {
    const jx = 664 + i * 48;
    ctx.fillStyle = 'rgba(230,240,245,0.75)'; rr(ctx, jx - 15, 92, 30, 36, 6); ctx.fill();
    ctx.fillStyle = c; rr(ctx, jx - 12, 104, 24, 21, 4); ctx.fill();
    ctx.fillStyle = '#5d3a1a'; rr(ctx, jx - 16, 86, 32, 8, 3); ctx.fill();
    ctx.fillStyle = '#3a2a18'; ctx.font = 'bold 6.5px Verdana'; ctx.textAlign = 'center'; ctx.fillText(jarNames[i], jx, 118);
  });
  ctx.restore();
  // wall clock
  ctx.save();
  ctx.fillStyle = '#f7f0dc'; ctx.beginPath(); ctx.arc(952, 106, 27, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8a5a24'; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.arc(952, 106, 27, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  const ang = (S.t % 60) / 60 * Math.PI * 2;
  ctx.beginPath(); ctx.moveTo(952, 106); ctx.lineTo(952 + Math.cos(ang - Math.PI / 2) * 15, 106 + Math.sin(ang - Math.PI / 2) * 15); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(952, 106); ctx.lineTo(952 + Math.cos(2.2) * 19, 106 + Math.sin(2.2) * 19); ctx.stroke();
  ctx.restore();
  // serving pass with warm light spilling out, far right
  ctx.save();
  ctx.fillStyle = '#2a1a10'; rr(ctx, 1012, 84, 232, 128, 8); ctx.fill();
  const passG = ctx.createLinearGradient(0, 84, 0, 212);
  passG.addColorStop(0, 'rgba(255,190,90,0.95)'); passG.addColorStop(1, 'rgba(200,110,40,0.85)');
  ctx.fillStyle = passG; rr(ctx, 1022, 94, 212, 108, 6); ctx.fill();
  ctx.fillStyle = 'rgba(60,30,5,0.55)';
  for (const px of [1062, 1128, 1194]) ctx.fillRect(px, 94, 7, 108);
  ctx.fillStyle = '#5d3a1a'; rr(ctx, 1012, 200, 232, 12, 5); ctx.fill();
  ctx.fillStyle = '#3a2410'; txt(ctx, '— PASS —', 1128, 232, 11, '#e8c48a', 'center');
  ctx.restore();
  // hanging copper pans rail, centre, with room to breathe
  ctx.save();
  ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(300, 218); ctx.lineTo(560, 218); ctx.stroke();
  [[330, 30], [408, 24], [486, 28]].forEach(([px, pr], i) => {
    ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(px, 218); ctx.lineTo(px, 232); ctx.stroke();
    const pg = ctx.createRadialGradient(px - 6, 246, 4, px, 252, pr);
    pg.addColorStop(0, '#e8a06a'); pg.addColorStop(1, '#8a4520');
    ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(px, 252, pr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,225,180,0.7)'; ell(ctx, px - pr * 0.35, 252 - pr * 0.35, pr * 0.3, pr * 0.14); ctx.fill();
  });
  // utensil rail, centre-right
  ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(648, 218); ctx.lineTo(880, 218); ctx.stroke();
  ctx.lineWidth = 3.4; ctx.strokeStyle = '#cfd8dc';
  for (const ux of [686, 752, 818]) {
    ctx.beginPath(); ctx.moveTo(ux, 218); ctx.lineTo(ux, 240); ctx.stroke();
    ell(ctx, ux, 252, 7, 11); ctx.stroke();
  }
  ctx.strokeStyle = '#b0bec5';
  ctx.beginPath(); ctx.moveTo(716, 218); ctx.lineTo(716, 236); ctx.lineTo(730, 252); ctx.stroke();
  ctx.restore();
  // a framed picture if the painting decor is owned, hung with space around it
  if (S.game && S.game.decorOwned && S.game.decorOwned.painting) { iconPainter(ctx, 'painting', 952, 268, 64); }
  // pendant lamps spread across the width
  for (const lx of [190, 640, 1090]) lampGlow(ctx, lx, 56, t);
  if (!withCounter) return;
  drawCounter(ctx, S);
}

function drawCounter(ctx, S) {
  const t = S.t;
  // floor hint behind the counter front's bottom edge
  ctx.fillStyle = '#3c2434';
  ctx.fillRect(0, 540, W, 20);
  // countertop surface: one long polished run across the whole frame
  const tg = ctx.createLinearGradient(0, COUNTER_Y - 14, 0, COUNTER_Y + 8);
  tg.addColorStop(0, '#e8b06a');
  tg.addColorStop(0.75, '#c98d4b');
  tg.addColorStop(1, '#a9713a');
  ctx.fillStyle = tg;
  ctx.fillRect(14, COUNTER_Y - 13, W - 28, 21);
  ctx.fillStyle = 'rgba(255,240,200,0.75)';
  ctx.fillRect(14, COUNTER_Y - 13, W - 28, 3); // polished front edge highlight
  ctx.fillStyle = 'rgba(120,70,20,0.35)';
  for (let i = 0; i < 9; i++) ctx.fillRect(60 + i * 140, COUNTER_Y - 6 + (i % 3) * 4, 74, 1.6); // wood grain flecks
  // counter front: paneled wood with a brass rail
  const fg = ctx.createLinearGradient(0, COUNTER_Y + 8, 0, 542);
  fg.addColorStop(0, '#8a5a24');
  fg.addColorStop(1, '#5f3c14');
  ctx.fillStyle = fg;
  ctx.fillRect(14, COUNTER_Y + 8, W - 28, 104);
  ctx.fillStyle = '#d4ac0d';
  ctx.fillRect(14, COUNTER_Y + 8, W - 28, 5); // brass rail
  ctx.fillStyle = 'rgba(255,235,170,0.8)';
  ctx.fillRect(14, COUNTER_Y + 8, W - 28, 1.6);
  ctx.strokeStyle = 'rgba(50,28,5,0.55)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const px = 40 + i * 152;
    rr(ctx, px, COUNTER_Y + 26, 118, 68, 6); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,220,160,0.14)';
    rr(ctx, px + 3, COUNTER_Y + 29, 112, 30, 5); ctx.stroke();
    ctx.strokeStyle = 'rgba(50,28,5,0.55)';
  }
  // decor: plant on the counter's left end, lamps standing right of the pass end
  if (S.game && S.game.decorOwned && S.game.decorOwned.plant) iconPainter(ctx, 'plant', 44, COUNTER_Y - 26, 46);
  if (S.game && S.game.decorOwned && S.game.decorOwned.lamps) iconPainter(ctx, 'lamp', 1244, COUNTER_Y - 24, 44);
  // the cat sleeps on the counter's far right end — intentional, it is a cat
  catPainter(ctx, 1196, COUNTER_Y - 16, 62, t);
}

// ------------------------------------------------------------------ service scene
function seatXOf(S, c) {
  return SEAT_X[S.seatOf && S.seatOf.has(c.uid) ? S.seatOf.get(c.uid) : 0];
}

function drawGuest(ctx, S, c) {
  const t = S.t;
  const seat = S.seatOf && S.seatOf.has(c.uid) ? S.seatOf.get(c.uid) : 0;
  const x = SEAT_X[seat];
  const type = CUSTOMER[c.typeId];
  const isMarco = c.typeId === 'marco';
  const bob = c.state === 'waiting' ? Math.sin(t * 1.7 + seat * 1.3) * 1.6 : 0;
  // floor shadow behind the counter (their standing line is back there)
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ell(ctx, x, COUNTER_Y + 4, 62, 7); ctx.fill();
  characterPainter(ctx, type, x, 306 + bob, 238, c.mood || 'hi', seat);
  if (isMarco) { // name tag + loyalty hearts on the figure
    const hearts = '♥'.repeat(S.game.hearts) + '♡'.repeat(Math.max(0, 5 - S.game.hearts));
    chip(ctx, x - 58, 398, 116, 22, '#7b241c', `MARCO ${hearts}`, 11);
  }
  if (c.state === 'served') {
    txt(ctx, type.lines ? type.lines.happy : 'Thank you!', x, 168 + bob, 14.5, '#b8f0b0', 'center', '900', DISPLAY);
    return;
  }
  if (c.state === 'left') {
    txt(ctx, 'Hmph!', x, 168, 15, '#f0a0a0', 'center', '900', DISPLAY);
    return;
  }
  // speech bubble with the order, above the head
  const recipe = RECIPE[c.order.recipeId];
  const bw = 158; const bh = 66;
  const bx = Math.max(8, Math.min(W - bw - 8, x - bw / 2));
  const by = 104 + bob * 0.5;
  ctx.save();
  ctx.fillStyle = 'rgba(255,251,238,0.97)';
  rr(ctx, bx, by, bw, bh, 13); ctx.fill();
  ctx.strokeStyle = '#8a5a24'; ctx.lineWidth = 2; rr(ctx, bx, by, bw, bh, 13); ctx.stroke();
  ctx.beginPath(); // tail
  ctx.moveTo(x - 9, by + bh - 2); ctx.lineTo(x + 9, by + bh - 2); ctx.lineTo(x, by + bh + 13); ctx.closePath();
  ctx.fillStyle = 'rgba(255,251,238,0.97)'; ctx.fill();
  drawDish(ctx, recipe, [], bx + 36, by + 36, 52, t, true);
  txt(ctx, recipe.name, bx + 68, by + 24, 12.5, '#4a2c14', 'left', '900', DISPLAY);
  const notes = [];
  if (c.order.variation) {
    const vIng = recipe.steps[c.order.variation.index];
    notes.push(c.order.variation.kind === 'no' ? `no ${ING[vIng].name}` : `extra ${ING[vIng].name}`);
  }
  if (c.order.recipeId === S.day.dotd) notes.push('★ SPECIAL ×2');
  txt(ctx, notes.join(' · ') || `${c.steps.length} layers`, bx + 68, by + 42, 10.5, '#8a6a3a', 'left');
  if (c.order.drinkId) drinkPainter(ctx, c.order.drinkId, bx + bw - 16, by + 48, 24);
  ctx.restore();
  // patience: a ring on the bubble corner + a bar, and the face carries the mood
  const f = Math.max(0, c.patience / c.patienceMax);
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 4.5;
  ctx.beginPath(); ctx.arc(bx + bw - 14, by + 12, 8, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = f > 0.5 ? '#58b368' : f > 0.28 ? '#f0a13c' : '#e74c3c';
  ctx.beginPath(); ctx.arc(bx + bw - 14, by + 12, 8, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2); ctx.stroke();
  ctx.restore();
  progressBar(ctx, bx + 10, by + bh + 16, bw - 20, 6, f, f > 0.5 ? '#58b368' : f > 0.28 ? '#f0a13c' : '#e74c3c');
  // selected ring on the floor line
  if (S.day.selected === c.uid) {
    ctx.save();
    ctx.strokeStyle = `rgba(244,197,66,${0.7 + Math.sin(t * 5) * 0.3})`;
    ctx.lineWidth = 3.5;
    ell(ctx, x, COUNTER_Y + 2, 76, 10); ctx.stroke();
    ctx.restore();
  }
  S.regions.push({ id: 'guest', x: x - 78, y: 150, w: 156, h: 290, data: c.uid });
}

function drawTicket(ctx, S, c) {
  const x = seatXOf(S, c) - 56;
  const y = COUNTER_Y + 34;
  const recipe = RECIPE[c.order.recipeId];
  ctx.save();
  ctx.fillStyle = S.day.selected === c.uid ? '#fff6d8' : '#fdf6df';
  rr(ctx, x, y, 112, 92, 5); ctx.fill();
  ctx.strokeStyle = '#b09a6a'; ctx.lineWidth = 1.5; rr(ctx, x, y, 112, 92, 5); ctx.stroke();
  ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(x + 56, y + 2, 5, 0, Math.PI * 2); ctx.fill(); // pin
  txt(ctx, recipe.name, x + 56, y + 19, 11, '#4a2c14', 'center', '900', DISPLAY);
  const steps = c.steps;
  steps.forEach((sid, i) => {
    const done = i < c.dish.length;
    const isNext = i === c.dish.length;
    txt(ctx, done ? '✓' : isNext ? '▸' : '·', x + 10, y + 36 + i * 12.5, 10.5, done ? '#2e7d32' : isNext ? '#c0392b' : '#9a8a6a', 'left', '900');
    txt(ctx, ING[sid].name, x + 22, y + 36 + i * 12.5, 10, done ? '#6a7a5a' : '#4a3a22', 'left', done ? 'normal' : 'bold');
  });
  if (c.order.drinkId) txt(ctx, `+ ${DRINK[c.order.drinkId].name}${c.drinkServed ? ' ✓' : ''}`, x + 56, y + 36 + steps.length * 12.5 + 2, 10, c.drinkServed ? '#2e7d32' : '#6a4a8a', 'center', '900');
  ctx.restore();
  S.regions.push({ id: 'guest', x, y, w: 112, h: 92, data: c.uid });
}

function drawStation(ctx, S, st) {
  const day = S.day;
  const cx = STATION_X[st.id];
  const x = cx - STATION_W / 2;
  const y = COUNTER_Y - STATION_H;
  const items = day.items.filter((it) => it.station === st.id);
  // soft contact shadow: the appliance stands ON the countertop
  ctx.fillStyle = 'rgba(40,18,0,0.35)';
  ell(ctx, cx, COUNTER_Y + 3, STATION_W * 0.56, 7); ctx.fill();
  APPLIANCES[st.id](ctx, x, y, STATION_W, STATION_H, items.length > 0, S.t);
  // brass name plaque on the counter front beneath the station
  chip(ctx, cx - 42, COUNTER_Y + 14, 84, 19, 'rgba(60,35,8,0.85)', st.name.toUpperCase(), 10.5, '#f4d98a');
  // items cooking on top of the appliance, each with its own progress ring
  items.forEach((it, i) => {
    const ix = cx + (i - (items.length - 1) / 2) * 44;
    const iy = y + 34;
    const frac = Math.min(1, it.elapsed / it.duration);
    const q = itemQuality(it);
    ctx.save();
    ctx.fillStyle = 'rgba(20,10,0,0.3)';
    ell(ctx, ix, iy + 17, 21, 5); ctx.fill();
    // a dark serving disc under the item so it reads against bright oil, flames and steel
    ctx.fillStyle = 'rgba(24,14,8,0.55)';
    ctx.beginPath(); ctx.arc(ix, iy, 20, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,225,170,0.35)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(ix, iy, 20, 0, Math.PI * 2); ctx.stroke();
    if (DRINK[it.id]) drinkPainter(ctx, it.id, ix, iy, 36);
    else ingredientPainter(ctx, it.id, ix, iy, 40, it.elapsed >= it.duration);
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.arc(ix, iy, 24, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = q === 'perfect' ? '#ffd94d' : q === 'good' ? '#7ed37e' : q === 'plain' ? '#e8e0cc' : '#ff9a3c';
    ctx.beginPath(); ctx.arc(ix, iy, 24, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
    if (q === 'perfect') {
      ctx.fillStyle = `rgba(255,215,60,${0.55 + Math.sin(S.t * 6) * 0.3})`;
      txt(ctx, 'PERFECT', ix, iy - 30, 10.5, '#ffe97a', 'center', '900', DISPLAY);
      ctx.strokeStyle = 'rgba(255,220,90,0.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ix, iy, 29 + Math.sin(S.t * 6) * 1.5, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
    S.regions.push({ id: 'item', x: ix - 24, y: iy - 24, w: 48, h: 48, data: it.uid });
  });
  S.regions.push({ id: 'station', x, y, w: STATION_W, h: STATION_H, data: st.id });
}

function drawPlatingBoard(ctx, S) {
  const day = S.day;
  const cx = PLATE_X;
  // contact shadow + the board section of the countertop
  ctx.fillStyle = 'rgba(40,18,0,0.3)';
  ell(ctx, cx, COUNTER_Y + 3, 100, 7); ctx.fill();
  ctx.save();
  const bg = ctx.createLinearGradient(0, COUNTER_Y - 26, 0, COUNTER_Y);
  bg.addColorStop(0, '#eec27f'); bg.addColorStop(1, '#c98d4b');
  ctx.fillStyle = bg;
  rr(ctx, cx - 96, COUNTER_Y - 26, 192, 24, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(90,50,10,0.5)'; ctx.lineWidth = 1.6; rr(ctx, cx - 96, COUNTER_Y - 26, 192, 24, 7); ctx.stroke();
  chip(ctx, cx - 46, COUNTER_Y + 14, 92, 19, 'rgba(60,35,8,0.85)', 'PLATING', 10.5, '#f4d98a');
  const target = targetOf(day, day.selected);
  if (target) {
    const recipe = RECIPE[target.order ? target.order.recipeId : target.recipeId];
    drawDish(ctx, recipe, target.dish, cx, COUNTER_Y - 34, 74, S.t, target.dish.length >= target.steps.length);
  } else {
    txt(ctx, 'tap a guest', cx, COUNTER_Y - 34, 12, '#7c5a24', 'center', 'bold', DISPLAY);
  }
  ctx.restore();
  S.regions.push({ id: 'plating', x: cx - 96, y: COUNTER_Y - 60, w: 192, h: 62, data: null });
}

function drawHUD(ctx, S) {
  const day = S.day;
  const game = S.game;
  ctx.save();
  ctx.fillStyle = 'rgba(30,16,30,0.94)';
  ctx.fillRect(0, 0, W, 56);
  ctx.fillStyle = '#c98d4b';
  ctx.fillRect(0, 54, W, 2.5);
  chip(ctx, 14, 11, 118, 34, '#7b241c', day.endless ? `WAVE ${day.wave}` : `DAY ${day.num} / 12`, 15);
  txt(ctx, `Goal $${day.goal}`, 148, 26, 13.5, '#f4d98a');
  progressBar(ctx, 148, 34, 170, 10, day.earned / day.goal, day.earned >= day.goal ? '#7ed37e' : '#f0a13c');
  txt(ctx, `$${day.earned}`, 326, 40, 16, '#ffe97a', 'left', '900', DISPLAY);
  // combo / fever centrepiece
  if (day.feverT > 0) {
    const pulse = 1 + Math.sin(S.t * 7) * 0.04;
    ctx.save();
    ctx.translate(640, 28); ctx.scale(pulse, pulse);
    const fg = ctx.createLinearGradient(0, -18, 0, 18);
    fg.addColorStop(0, '#ff7847'); fg.addColorStop(1, '#c0392b');
    ctx.fillStyle = fg; rr(ctx, -120, -18, 240, 36, 18); ctx.fill();
    ctx.strokeStyle = '#ffd94d'; ctx.lineWidth = 2.5; rr(ctx, -120, -18, 240, 36, 18); ctx.stroke();
    txt(ctx, `🔥 FEVER ×2 — ${Math.ceil(day.feverT)}s`, 0, 7, 17, '#fff3c9', 'center', '900', DISPLAY);
    ctx.restore();
  } else if (day.combo > 0) {
    const mult = comboMult(day);
    chip(ctx, 520, 9, 240, 26, mult >= 3 ? '#c0392b' : mult >= 2 ? '#d35400' : mult >= 1.5 ? '#b9770e' : '#5d4a68',
      `COMBO ×${day.combo}${mult > 1 ? `  →  pays ×${mult}` : ''}`, 14.5);
    progressBar(ctx, 540, 40, 200, 8, day.comboT / CONFIG.COMBO_WINDOW, '#f4c542');
  } else {
    txt(ctx, 'Serve dishes back-to-back to build a COMBO!', 640, 34, 13.5, '#cbb8d8', 'center');
  }
  // day clock + difficulty + buttons
  txt(ctx, `${Math.ceil(day.timeLeft)}s`, 880, 26, 13.5, '#f4d98a', 'right');
  progressBar(ctx, 790, 34, 110, 10, day.timeLeft / CONFIG.DAY_SECONDS, day.timeLeft < 20 ? '#e74c3c' : '#7fb3d5');
  chip(ctx, 916, 12, 92, 32, '#4a3468', game.difficulty === 'relaxed' ? 'RELAXED' : 'NORMAL', 12.5);
  button(ctx, S, 'pause', 1020, 10, 76, 36, 'II', { fill: '#5d4a68', size: 15 });
  button(ctx, S, 'mute', 1108, 10, 76, 36, S.muted ? '🔇 OFF' : '🔊 ON', { fill: '#5d4a68', size: 13 });
  button(ctx, S, 'quitday', 1196, 10, 72, 36, 'MAP', { fill: '#5d4a68', size: 13 });
  ctx.restore();
}

function drawPantry(ctx, S) {
  const x0 = 16; const y0 = 560;
  panel(ctx, x0, y0, 544, 226);
  txt(ctx, 'PANTRY', x0 + 16, y0 + 25, 15, '#f4d98a', 'left', '900', DISPLAY);
  txt(ctx, 'tap an ingredient, then tap its station — it cooks by itself!', x0 + 92, y0 + 25, 11.5, '#cbb8d8');
  const cellW = 86; const cellH = 31;
  const entries = [
    ...INGREDIENTS.map((ing) => ({ kind: 'ing', id: ing.id })),
    ...DRINKS.map((d) => ({ kind: 'drink', id: d.id })),
  ];
  entries.forEach((e, i) => {
    const cx = x0 + 12 + (i % 6) * cellW;
    const cy = y0 + 38 + Math.floor(i / 6) * cellH;
    const active = S.held && S.held.kind === e.kind && S.held.id === e.id;
    ctx.save();
    ctx.fillStyle = active ? 'rgba(244,197,66,0.4)' : 'rgba(255,255,255,0.07)';
    rr(ctx, cx, cy, cellW - 6, cellH - 4, 7); ctx.fill();
    if (active) { ctx.strokeStyle = '#f4c542'; ctx.lineWidth = 2; rr(ctx, cx, cy, cellW - 6, cellH - 4, 7); ctx.stroke(); }
    if (e.kind === 'ing') ingredientPainter(ctx, e.id, cx + 15, cy + 13, 21);
    else drinkPainter(ctx, e.id, cx + 15, cy + 13, 19);
    const label = e.kind === 'ing' ? ING[e.id].name : DRINK[e.id].name;
    txt(ctx, label, cx + 28, cy + 17, 10, '#fdf3e0');
    ctx.restore();
    S.regions.push({ id: 'pantry', x: cx, y: cy, w: cellW - 6, h: cellH - 4, data: e });
  });
}

function drawPlatingPanel(ctx, S) {
  const day = S.day;
  const x0 = 576; const y0 = 560;
  panel(ctx, x0, y0, 352, 226);
  txt(ctx, 'PLATING', x0 + 16, y0 + 25, 15, '#f4d98a', 'left', '900', DISPLAY);
  const target = targetOf(day, day.selected);
  if (!target) {
    txt(ctx, 'Tap a guest or the phone order', x0 + 176, y0 + 105, 14.5, '#cbb8d8', 'center');
    txt(ctx, 'to start plating their dish.', x0 + 176, y0 + 128, 14.5, '#cbb8d8', 'center');
    return;
  }
  const recipeId = target.order ? target.order.recipeId : target.recipeId;
  const recipe = RECIPE[recipeId];
  const steps = target.steps;
  const complete = target.dish.length >= steps.length;
  const pop = complete ? 1 + Math.sin(S.t * 5) * 0.03 : 1;
  ctx.save();
  ctx.translate(x0 + 84, y0 + 118); ctx.scale(pop, pop);
  drawDish(ctx, recipe, target.dish, 0, 0, 118, S.t, complete);
  ctx.restore();
  txt(ctx, recipe.name, x0 + 84, y0 + 200, 13.5, '#ffe97a', 'center', '900', DISPLAY);
  if (recipeId === day.dotd) chip(ctx, x0 + 30, y0 + 36, 108, 20, '#b9770e', '★ SPECIAL ×2', 11);
  // checklist
  steps.forEach((sid, i) => {
    const done = i < target.dish.length;
    const isNext = i === target.dish.length;
    const yy = y0 + 52 + i * 21;
    ingredientPainter(ctx, sid, x0 + 178, yy - 4, 19, done);
    txt(ctx, done ? '✓' : isNext ? '▸' : '·', x0 + 192, yy, 12.5, done ? '#7ed37e' : isNext ? '#ffd94d' : '#8a7a9a', 'left', '900');
    txt(ctx, `${ING[sid].name} · ${ING[sid].process}`, x0 + 208, yy, 11.5, done ? '#9ab38a' : '#fdf3e0');
  });
  if (target.order && target.order.drinkId) txt(ctx, `+ ${DRINK[target.order.drinkId].name} ${target.drinkServed ? '✓ served' : '— brew it!'}`, x0 + 178, y0 + 52 + steps.length * 21 + 6, 11.5, target.drinkServed ? '#7ed37e' : '#d8b0f0');
  button(ctx, S, 'serve', x0 + 168, y0 + 178, 168, 38, complete ? '🔔 SERVE!' : 'not ready', { fill: '#2e7d32', size: 15, disabled: !complete });
}

function drawSidePanel(ctx, S) {
  const day = S.day;
  const x0 = 944; const y0 = 560;
  panel(ctx, x0, y0, 320, 226);
  txt(ctx, 'MISE EN PLACE', x0 + 16, y0 + 25, 13.5, '#f4d98a', 'left', '900', DISPLAY);
  const slots = traySlots(S.game);
  for (let i = 0; i < slots; i++) {
    const sx = x0 + 16 + i * 52;
    const sy = y0 + 38;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    rr(ctx, sx, sy, 46, 46, 9); ctx.fill();
    ctx.strokeStyle = 'rgba(244,197,66,0.4)'; ctx.lineWidth = 1.5; rr(ctx, sx, sy, 46, 46, 9); ctx.stroke();
    const entry = day.tray[i];
    if (entry) ingredientPainter(ctx, entry.id, sx + 23, sy + 23, 34, true);
    ctx.restore();
    if (day.tray[i]) S.regions.push({ id: 'tray', x: sx, y: sy, w: 46, h: 46, data: i });
  }
  button(ctx, S, 'trash', x0 + 226, y0 + 40, 82, 42, '🗑 TRASH', { fill: '#7b241c', size: 12.5 });
  txt(ctx, 'tap a cooked item to plate it;', x0 + 16, y0 + 106, 11, '#cbb8d8');
  txt(ctx, 'extras wait here. TRASH discards', x0 + 16, y0 + 121, 11, '#cbb8d8');
  txt(ctx, 'the last item you tapped.', x0 + 16, y0 + 136, 11, '#cbb8d8');
  // the phone order (one at a time, its own countdown, flat payout)
  txt(ctx, 'PHONE ORDER', x0 + 16, y0 + 162, 13.5, '#f4d98a', 'left', '900', DISPLAY);
  const p = day.phone;
  if (!p) {
    txt(ctx, 'the phone is quiet…', x0 + 150, y0 + 162, 11.5, '#9a8ab0');
  } else {
    const px = x0 + 16;
    const py = y0 + 172;
    const recipe = RECIPE[p.recipeId];
    ctx.save();
    ctx.fillStyle = day.selected === 'phone' ? 'rgba(244,197,66,0.35)' : 'rgba(255,255,255,0.09)';
    rr(ctx, px, py, 288, 44, 9); ctx.fill();
    if (day.selected === 'phone') { ctx.strokeStyle = '#f4c542'; ctx.lineWidth = 2; rr(ctx, px, py, 288, 44, 9); ctx.stroke(); }
    drawDish(ctx, recipe, p.dish, px + 24, py + 24, 34, S.t, p.dish.length >= p.steps.length);
    txt(ctx, `📞 ${recipe.name} — ${p.dish.length}/${p.steps.length} layers`, px + 48, py + 19, 11.5, '#fdf3e0', 'left', '900', DISPLAY);
    txt(ctx, `flat $${p.payout} · plate it like any dish, then SERVE`, px + 48, py + 35, 10.5, '#ffe97a');
    progressBar(ctx, px + 200, py + 6, 78, 5, Math.max(0, p.timeLeft / CONFIG.PHONE_SECONDS), '#7fb3d5');
    ctx.restore();
    S.regions.push({ id: 'phone', x: px, y: py, w: 288, h: 44, data: 'phone' });
  }
}

function drawPopups(ctx, S) {
  for (const p of S.popups) {
    const a = Math.max(0, 1 - p.age / 1.5);
    ctx.save();
    ctx.globalAlpha = a;
    txt(ctx, p.text, p.x, p.y - p.age * 42, p.size || 19, p.color, 'center', '900', DISPLAY);
    ctx.restore();
  }
  // the engine's own popups (serve payouts), floating over the guest who paid
  if (S.day && (S.screen === 'service' || S.screen === 'pause')) {
    for (const p of S.day.popups) {
      const a = Math.max(0, Math.min(1, p.t / 0.5));
      ctx.save();
      ctx.globalAlpha = a;
      if (p.uid === 'phone') {
        txt(ctx, p.text, 1104, 700 - (1.6 - p.t) * 34, 19, '#ffe97a', 'center', '900', DISPLAY);
      } else {
        const c = S.day.customers.find((cu) => cu.uid === p.uid);
        const x = c ? seatXOf(S, c) : 640;
        txt(ctx, p.text, x, 196 - (1.6 - p.t) * 34, 19, p.text.includes('PERFECT') ? '#ffd94d' : '#b8f0b0', 'center', '900', DISPLAY);
      }
      ctx.restore();
    }
  }
  if (S.toast) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, S.toast.age * 4, (2.2 - S.toast.age) * 2);
    chip(ctx, 640 - 210, 66, 420, 30, 'rgba(30,16,30,0.9)', S.toast.text, 13.5);
    ctx.restore();
  }
}

function drawTutorial(ctx, S) {
  if (!S.tutorial || S.tutorial.done) return;
  const steps = [
    ['1', 'Tap an ingredient in the PANTRY below.', 300, 540],
    ['2', 'Now tap its glowing STATION on the counter.', 262, 300],
    ['3', 'It cooks BY ITSELF — watch the ring fill. Gold = PERFECT!', 262, 300],
    ['4', 'Tap the cooked item to plate it on the dish.', 640, 380],
    ['5', 'Finish every layer, then press SERVE!', 760, 700],
  ];
  const [n, text, ax, ay] = steps[Math.min(S.tutorial.step, steps.length - 1)];
  ctx.save();
  ctx.fillStyle = 'rgba(255,246,216,0.97)';
  const bw = 430;
  const bx = Math.max(10, Math.min(W - bw - 10, ax - bw / 2));
  const by = ay > 500 ? ay - 118 : ay + 26;
  rr(ctx, bx, by, bw, 64, 12); ctx.fill();
  ctx.strokeStyle = '#b3543f'; ctx.lineWidth = 2.5; rr(ctx, bx, by, bw, 64, 12); ctx.stroke();
  ctx.fillStyle = '#b3543f'; ctx.beginPath(); ctx.arc(bx + 30, by + 32, 16, 0, Math.PI * 2); ctx.fill();
  txt(ctx, n, bx + 30, by + 39, 17, '#fff', 'center', '900', DISPLAY);
  txt(ctx, text, bx + 56, by + 38, 13.5, '#4a2c14');
  button(ctx, S, 'tutskip', bx + bw - 66, by + 70, 62, 24, '✕ skip', { fill: '#5d4a68', size: 11.5 });
  ctx.restore();
}

function drawService(ctx, S) {
  const day = S.day;
  // seat assignment: each present customer keeps a stable seat while they are here
  if (!S.seatOf) S.seatOf = new Map();
  const present = new Set(day.customers.map((c) => c.uid));
  for (const uid of [...S.seatOf.keys()]) if (!present.has(uid)) S.seatOf.delete(uid);
  for (const c of day.customers) {
    if (!S.seatOf.has(c.uid)) {
      const used = new Set(S.seatOf.values());
      let seat = 0;
      while (used.has(seat) && seat < SEAT_X.length - 1) seat += 1;
      S.seatOf.set(c.uid, seat);
    }
  }
  drawRoom(ctx, S);
  // guests first: they stand BEHIND the counter; the counter front drawn later covers them waist-down
  for (const c of day.customers) drawGuest(ctx, S, c);
  drawCounter(ctx, S);
  for (const st of STATIONS) drawStation(ctx, S, st);
  drawPlatingBoard(ctx, S);
  for (const c of day.customers) if (c.state === 'waiting') drawTicket(ctx, S, c);
  if (day.feverT > 0) { // warm fever wash over the room edges
    const g = ctx.createRadialGradient(640, 400, 320, 640, 400, 780);
    g.addColorStop(0, 'rgba(255,120,40,0)');
    g.addColorStop(1, 'rgba(255,110,30,0.20)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  drawHUD(ctx, S);
  drawPantry(ctx, S);
  drawPlatingPanel(ctx, S);
  drawSidePanel(ctx, S);
  drawPopups(ctx, S);
  drawTutorial(ctx, S);
  // vignette
  const v = ctx.createRadialGradient(640, 380, 420, 640, 380, 860);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(10,0,10,0.28)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}

// ------------------------------------------------------------------ menu screens
function drawTitle(ctx, S) {
  drawRoom(ctx, S);
  rosaPainter(ctx, 150, 300, 190);
  txt(ctx, 'Rosa, head cook', 150, 428, 12.5, '#f4d98a', 'center');
  logoPainter(ctx, 640, 168, 660, S.t);
  txt(ctx, 'Cook fast, plate pretty, and pay off the bank before it takes the diner!', 640, 316, 16.5, '#fdf3e0', 'center');
  const stars = totalStars(S.game);
  chip(ctx, 490, 336, 300, 30, 'rgba(30,16,30,0.85)', `★ ${stars} / 36   ·   Loan repaid $${S.game.repaid} / $${CONFIG.LOAN_TOTAL}`, 13.5);
  button(ctx, S, 'play', 490, 386, 300, 56, S.game.campaignWon ? '▶  STAGE MAP' : '▶  PLAY — STAGE MAP', { fill: '#2e7d32', size: 19 });
  button(ctx, S, 'howto', 490, 454, 144, 44, 'HOW TO PLAY', { fill: '#5d4a68', size: 13.5 });
  button(ctx, S, 'recipes', 646, 454, 144, 44, 'RECIPE BOOK', { fill: '#5d4a68', size: 13.5 });
  button(ctx, S, 'achievements', 490, 508, 144, 44, 'TROPHIES', { fill: '#5d4a68', size: 13.5 });
  button(ctx, S, 'mute2', 646, 508, 144, 44, S.muted ? 'SOUND: OFF' : 'SOUND: ON', { fill: '#5d4a68', size: 13.5 });
  txt(ctx, 'Difficulty:', 528, 592, 14.5, '#f4d98a');
  button(ctx, S, 'diff-relaxed', 622, 570, 110, 34, 'RELAXED', { fill: S.game.difficulty === 'relaxed' ? '#2e7d32' : '#4a3a52', size: 13 });
  button(ctx, S, 'diff-normal', 742, 570, 110, 34, 'NORMAL', { fill: S.game.difficulty === 'normal' ? '#2e7d32' : '#4a3a52', size: 13 });
  if (S.game.campaignWon) button(ctx, S, 'endless', 490, 622, 300, 44, `🌊 ENDLESS MODE — best wave ${S.game.endlessBest}`, { fill: '#7b241c', size: 14.5 });
  txt(ctx, 'A tiny diner-rescue cooking game · every picture and tune is drawn & synthesized in code', 640, 762, 12, '#9a8ab0', 'center', 'normal');
}

function drawLadder(ctx, S) {
  const g = S.game;
  // dusk sky
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#241a3f');
  sky.addColorStop(0.55, '#6b3555');
  sky.addColorStop(0.8, '#c96a3f');
  sky.addColorStop(1, '#3a5a34');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fdf6d8';
  for (let i = 0; i < 70; i++) { const sx = (i * 173) % W; const sy = (i * 97) % 300; ctx.globalAlpha = 0.35 + ((i * 7) % 10) / 16; ctx.fillRect(sx, sy, 2.4, 2.4); }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#f7e8b0'; ctx.beginPath(); ctx.arc(1150, 84, 34, 0, Math.PI * 2); ctx.fill(); // moon
  ctx.fillStyle = '#efe0a0'; ctx.beginPath(); ctx.arc(1138, 76, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(1162, 94, 5, 0, Math.PI * 2); ctx.fill();
  // skyline
  ctx.fillStyle = '#2c1e33';
  let bx = 0;
  const heights = [130, 90, 160, 110, 70, 140, 95, 120, 80, 150, 100, 125, 85, 145, 105];
  heights.forEach((hgt, i) => { const bw = 62 + (i % 4) * 22; ctx.fillRect(bx, 470 - hgt, bw, hgt); bx += bw + 8; });
  ctx.fillStyle = 'rgba(255,205,110,0.85)';
  for (let i = 0; i < 60; i++) ctx.fillRect((i * 211) % 1240 + 12, 360 + (i * 53) % 96, 5, 7);
  // ground
  const gg = ctx.createLinearGradient(0, 470, 0, H);
  gg.addColorStop(0, '#4a6b3a'); gg.addColorStop(1, '#2e4a26');
  ctx.fillStyle = gg;
  ctx.fillRect(0, 470, W, H - 470);
  // trees + lamps along the way
  for (const [tx, ts] of [[210, 1], [470, 0.8], [700, 1.1], [960, 0.85], [300, 0.7], [820, 0.75], [1120, 0.9]]) {
    ctx.fillStyle = '#4a3220'; ctx.fillRect(tx - 4, 520 - 26 * ts, 8, 30 * ts);
    ctx.fillStyle = '#2e5a2a';
    ctx.beginPath(); ctx.arc(tx, 500 - 30 * ts, 30 * ts, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(tx - 20 * ts, 512 - 24 * ts, 20 * ts, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(tx + 20 * ts, 512 - 24 * ts, 20 * ts, 0, Math.PI * 2); ctx.fill();
  }
  for (const lx of [120, 380, 620, 880, 1160]) {
    ctx.strokeStyle = '#241a12'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(lx, 560); ctx.lineTo(lx, 492); ctx.stroke();
    const lg = ctx.createRadialGradient(lx, 486, 2, lx, 486, 40);
    lg.addColorStop(0, 'rgba(255,215,130,0.9)'); lg.addColorStop(1, 'rgba(255,215,130,0)');
    ctx.fillStyle = lg; ctx.fillRect(lx - 40, 446, 80, 80);
    ctx.fillStyle = '#ffd98a'; ctx.beginPath(); ctx.arc(lx, 486, 6, 0, Math.PI * 2); ctx.fill();
  }
  // Rosa's Diner at the trailhead
  ctx.save();
  ctx.fillStyle = '#8a4a2e'; rr(ctx, 28, 596, 168, 96, 6); ctx.fill();
  ctx.fillStyle = '#5d2f1a'; ctx.beginPath(); ctx.moveTo(16, 600); ctx.lineTo(112, 556); ctx.lineTo(208, 600); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f7c873'; rr(ctx, 48, 622, 54, 40, 4); ctx.fill();
  ctx.fillStyle = '#7b4a21'; rr(ctx, 124, 616, 44, 76, 4); ctx.fill();
  chip(ctx, 36, 566, 152, 24, '#7b241c', "ROSA'S DINER", 12.5);
  ctx.restore();
  // the BANK at stage 12
  ctx.save();
  ctx.fillStyle = '#cfc4ae';
  ctx.fillRect(1064, 150, 188, 128);
  ctx.beginPath(); ctx.moveTo(1048, 150); ctx.lineTo(1158, 104); ctx.lineTo(1268, 150); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#b8ab90';
  for (const cx of [1084, 1126, 1168, 1210]) ctx.fillRect(cx, 162, 17, 100);
  ctx.fillStyle = '#8a7c60'; ctx.fillRect(1056, 272, 204, 12);
  ctx.fillStyle = '#4a3a22'; txt(ctx, 'BANK', 1158, 138, 21, '#f4e3b2', 'center', '900', DISPLAY);
  ctx.restore();
  // stepping-stone trail
  const nodes = [];
  for (let i = 0; i < 12; i++) {
    const f = i / 11;
    const nx = 130 + f * 1000 + Math.sin(f * Math.PI * 1.6) * 40;
    const ny = 640 - f * 330 + Math.sin(f * Math.PI * 3.2) * 26;
    nodes.push([nx, ny]);
  }
  ctx.strokeStyle = 'rgba(240,220,170,0.35)';
  ctx.lineWidth = 3; ctx.setLineDash([2, 9]); ctx.lineCap = 'round';
  ctx.beginPath();
  nodes.forEach(([nx, ny], i) => (i ? ctx.lineTo(nx, ny) : ctx.moveTo(nx, ny)));
  ctx.stroke();
  ctx.setLineDash([]);
  const current = g.dayUnlocked;
  nodes.forEach(([nx, ny], i) => {
    const day = i + 1;
    const done = (g.stars[day] || 0) > 0;
    const isCurrent = day === current && !done;
    const locked = day > g.dayUnlocked;
    ctx.save();
    ctx.fillStyle = locked ? '#5a5560' : done ? '#7cb35a' : '#e8b06a';
    ell(ctx, nx, ny + 12, 27, 9); ctx.fill(); // stone
    const pulse = isCurrent ? 1 + Math.sin(S.t * 4) * 0.12 : 1;
    ctx.translate(nx, ny); ctx.scale(pulse, pulse);
    const ng = ctx.createRadialGradient(-6, -8, 4, 0, 0, 25);
    ng.addColorStop(0, locked ? '#8a8590' : done ? '#a5d68a' : '#ffd98a');
    ng.addColorStop(1, locked ? '#4a4550' : done ? '#4a7c34' : '#c47b27');
    ctx.fillStyle = ng;
    ctx.beginPath(); ctx.arc(0, 0, 23, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = isCurrent ? '#ffd94d' : 'rgba(30,15,0,0.5)';
    ctx.lineWidth = isCurrent ? 3.5 : 2;
    ctx.beginPath(); ctx.arc(0, 0, 23, 0, Math.PI * 2); ctx.stroke();
    if (locked) txt(ctx, '🔒', 0, 7, 16, '#fff', 'center');
    else txt(ctx, String(day), 0, 8, 18, '#3a2205', 'center', '900', DISPLAY);
    ctx.restore();
    if (done) starsRow(ctx, g.stars[day], nx - 22, ny + 34, 8.5, 22);
    if (!locked) S.regions.push({ id: 'stage', x: nx - 26, y: ny - 26, w: 52, h: 52, data: day });
    if (isCurrent) rosaPainter(ctx, nx + 34, ny - 52, 62);
  });
  // header
  panel(ctx, 16, 12, 700, 56, 'rgba(30,16,30,0.88)');
  const starTotal = totalStars(g);
  txt(ctx, `★ ${starTotal} / 36`, 36, 48, 20, '#ffd94d', 'left', '900', DISPLAY);
  txt(ctx, 'Loan repaid', 190, 33, 11.5, '#cbb8d8');
  progressBar(ctx, 190, 40, 240, 11, g.repaid / CONFIG.LOAN_TOTAL, '#7ed37e');
  txt(ctx, `$${g.repaid} / $${CONFIG.LOAN_TOTAL}`, 442, 50, 13.5, '#ffe97a');
  txt(ctx, `Purse $${purse(g)}`, 580, 48, 15, '#b8f0b0', 'left', '900', DISPLAY);
  button(ctx, S, 'back', 1130, 726, 134, 48, '← TITLE', { fill: '#5d4a68', size: 14.5 });
  if (g.campaignWon) button(ctx, S, 'endless', 960, 726, 158, 48, '🌊 ENDLESS', { fill: '#7b241c', size: 14 });
  heading(ctx, 'THE ROAD TO THE BANK', 640, 44, 27);
  drawPopups(ctx, S);
}

function drawStory(ctx, S) {
  drawRoom(ctx, S);
  ctx.fillStyle = 'rgba(16,6,16,0.62)';
  ctx.fillRect(0, 0, W, H);
  const scene = S.storyScene;
  panel(ctx, 240, 210, 800, 380);
  if (scene.speaker === 'Rosa') rosaPainter(ctx, 360, 300, 170);
  else if (scene.speaker === 'Marco') characterPainter(ctx, CUSTOMER.marco, 360, 316, 190, 'hi', 1);
  else characterPainter(ctx, { id: 'critic', color: '#3a3f4a', hair: '#1d1d22', skin: '#e8b07e' }, 360, 316, 190, 'wait', 1);
  txt(ctx, scene.speaker.toUpperCase(), 360, 492, 14, '#f4d98a', 'center', '900', DISPLAY);
  heading(ctx, scene.speaker === 'Rosa' ? 'ROSA' : scene.speaker.toUpperCase(), 700, 268, 26);
  ctx.save();
  ctx.fillStyle = '#fdf3e0';
  ctx.font = '16.5px "Segoe UI", Verdana, sans-serif';
  ctx.textAlign = 'left';
  const words = scene.text.split(' ');
  let line = ''; let ly = 310;
  for (const w of words) {
    if (ctx.measureText(line + w).width > 470) { ctx.fillText(line, 492, ly); ly += 25; line = ''; }
    line += w + ' ';
  }
  ctx.fillText(line, 492, ly);
  ctx.restore();
  button(ctx, S, 'story-next', 800, 516, 180, 46, S.storyLast ? 'START COOKING →' : 'NEXT →', { fill: '#2e7d32', size: 15 });
  button(ctx, S, 'story-skip', 620, 516, 160, 46, 'SKIP', { fill: '#5d4a68', size: 14 });
}

function drawIntro(ctx, S) {
  drawRoom(ctx, S);
  ctx.fillStyle = 'rgba(16,6,16,0.55)';
  ctx.fillRect(0, 0, W, H);
  const dayNum = S.pendingDay;
  const game = S.game;
  const goal = Math.round(DAY_GOALS[dayNum - 1] * DIFFICULTY[game.difficulty].goal);
  panel(ctx, 330, 120, 620, 540);
  heading(ctx, `DAY ${dayNum}`, 640, 182, 38);
  txt(ctx, `Goal: earn $${goal} before the clock runs out`, 640, 224, 17, '#ffe97a', 'center');
  txt(ctx, `★ at $${goal}    ★★ at $${Math.round(goal * CONFIG.STAR_2)}    ★★★ at $${Math.round(goal * CONFIG.STAR_3)}`, 640, 252, 14.5, '#f4d98a', 'center');
  const dotd = RECIPE[dishOfTheDay(dayNum)];
  chip(ctx, 490, 276, 300, 26, '#b9770e', '★ DISH OF THE DAY — PAYS DOUBLE ★', 12.5);
  drawDish(ctx, dotd, [], 640, 356, 92, S.t, true);
  txt(ctx, dotd.name, 640, 428, 16, '#fdf3e0', 'center', '900', DISPLAY);
  const fresh = unlockedRecipes(dayNum).filter((r) => unlockedRecipes(dayNum - 1).every((o) => o.id !== r.id));
  if (fresh.length && dayNum <= 12) txt(ctx, `New on the menu: ${fresh.map((r) => r.name).join(' · ')}`, 640, 462, 13.5, '#b8f0b0', 'center');
  if ([2, 4, 6, 8, 10, 12].includes(dayNum)) txt(ctx, '♥ Marco, your regular, is coming today — keep him happy!', 640, 490, 13.5, '#f0a0b0', 'center');
  txt(ctx, game.difficulty === 'relaxed' ? 'Relaxed: goals ×0.8 · patience ×1.4 · cooking ×0.85' : 'Normal difficulty', 640, 522, 12.5, '#9a8ab0', 'center');
  button(ctx, S, 'startday', 490, 556, 300, 54, '🔔  START THE DAY', { fill: '#2e7d32', size: 18 });
  button(ctx, S, 'back', 356, 676, 130, 42, '← MAP', { fill: '#5d4a68', size: 13.5 });
}

function drawHowto(ctx, S) {
  ctx.fillStyle = '#33203a';
  ctx.fillRect(0, 0, W, H);
  heading(ctx, 'HOW TO PLAY', 640, 58, 34);
  panel(ctx, 40, 84, 590, 640);
  const lines = [
    ['THE GOAL', 'Earn the day\'s coin goal before the clock ends. Win all 12 days to repay Rosa\'s $5,450 loan and save the diner from the bank!'],
    ['COOKING — NO CLICKS NEEDED', 'Tap a pantry ingredient, then its station. Every ingredient cooks BY ITSELF in its own time (egg 3s … steak 11s) — watch the ring fill. Tapping a cooking item gives it a flip/stir (−0.6s), purely optional.'],
    ['QUALITY', 'Fresh off the heat an item is PERFECT (gold) and stays perfect for a generous hold, then steps down good → plain. Nothing ever burns and nothing vanishes — only TRASH discards food. A dish pays by its least-perfect cooked layer: PERFECT ×1.15, plain ×0.85.'],
    ['COMBO & FEVER', 'Serve within 10s of the last serve to grow your combo: ×1.5 at 3, ×2 at 6, ×3 at 9. A PERFECT serve adds +2. At combo 8, FEVER runs 20s: cooking twice as fast, everything pays double. An angry walkout breaks the combo.'],
    ['BUFFS (leveled shop)', 'Pantry Mastery: cooking −1s per level (never below 2s). Station upgrades: −1s per level on their station. Big Tray: +1 mise en place slot per level. Helper Hands: stirs every 6s / 4.5s / 3s by level.'],
    ['EXTRAS', 'Dish of the Day pays double. Tickets may say "no X" or "extra Y" — the dish must match. Drinks brew at the drinks station. Phone orders pay a flat $26. Marco the regular fills a loyalty heart each happy visit.'],
  ];
  let ly = 122;
  for (const [h, body] of lines) {
    txt(ctx, h, 64, ly, 15, '#ffd94d', 'left', '900', DISPLAY);
    ly += 21;
    ctx.save();
    ctx.fillStyle = '#e9ddf2';
    ctx.font = '13.5px "Segoe UI", Verdana, sans-serif';
    const words = body.split(' ');
    let line = '';
    for (const w of words) {
      if (ctx.measureText(line + w).width > 540) { ctx.fillText(line, 64, ly); ly += 18; line = ''; }
      line += w + ' ';
    }
    ctx.fillText(line, 64, ly);
    ctx.restore();
    ly += 34;
  }
  panel(ctx, 654, 84, 586, 640);
  txt(ctx, 'SOUND CUE MAP', 678, 122, 15, '#ffd94d', 'left', '900', DISPLAY);
  txt(ctx, 'Every action has its own synthesized cue — no audio files.', 678, 144, 12.5, '#cbb8d8');
  CUE_MAP.forEach(([what, cue], i) => {
    const yy = 178 + i * 26.5;
    txt(ctx, what, 678, yy, 13, '#fdf3e0');
    txt(ctx, cue, 1216, yy, 13, '#f4d98a', 'right');
  });
  button(ctx, S, 'back', 40, 736, 150, 46, '← BACK', { fill: '#5d4a68', size: 14.5 });
}

function drawRecipes(ctx, S) {
  ctx.fillStyle = '#33203a';
  ctx.fillRect(0, 0, W, H);
  heading(ctx, 'RECIPE BOOK — 26 DISHES', 640, 54, 30);
  txt(ctx, 'Every finished dish is drawn in its own vessel, built only from its recipe\'s layers, in order.', 640, 82, 13.5, '#cbb8d8', 'center');
  RECIPES.forEach((r, i) => {
    const cx = 36 + (i % 7) * 176;
    const cy = 100 + Math.floor(i / 7) * 158;
    const unlocked = RECIPES.indexOf(r) < unlockedRecipes(S.game.campaignWon ? 12 : S.game.dayUnlocked).length;
    ctx.save();
    ctx.globalAlpha = unlocked ? 1 : 0.45;
    panel(ctx, cx, cy, 164, 146, 'rgba(50,30,52,0.95)', unlocked ? '#c98d4b' : '#6a5a72');
    drawDish(ctx, r, [], cx + 82, cy + 52, 74, S.t, true);
    txt(ctx, r.name, cx + 82, cy + 106, 12, '#fdf3e0', 'center', '900', DISPLAY);
    txt(ctx, `$${dishPrice(r)} · ${r.steps.length} layers`, cx + 82, cy + 124, 10.5, '#f4d98a', 'center');
    if (!unlocked) txt(ctx, '🔒', cx + 146, cy + 24, 13, '#fff', 'center');
    ctx.restore();
  });
  button(ctx, S, 'back', 40, 736, 150, 46, '← BACK', { fill: '#5d4a68', size: 14.5 });
}

import { ACHIEVEMENTS } from './data.js';
function drawAchievements(ctx, S) {
  ctx.fillStyle = '#33203a';
  ctx.fillRect(0, 0, W, H);
  heading(ctx, 'TROPHIES', 640, 58, 34);
  ACHIEVEMENTS.forEach((a, i) => {
    const cx = 90 + (i % 3) * 380;
    const cy = 100 + Math.floor(i / 3) * 168;
    const got = !!S.game.achievements[a.id];
    panel(ctx, cx, cy, 350, 148, got ? 'rgba(80,55,20,0.95)' : 'rgba(50,30,52,0.95)', got ? '#f4c542' : '#6a5a72');
    ctx.save();
    ctx.globalAlpha = got ? 1 : 0.55;
    iconPainter(ctx, a.icon, cx + 58, cy + 62, 62);
    ctx.restore();
    txt(ctx, a.name, cx + 104, cy + 56, 16.5, got ? '#ffd94d' : '#cbb8d8', 'left', '900', DISPLAY);
    txt(ctx, a.text, cx + 104, cy + 82, 12.5, '#e9ddf2');
    txt(ctx, got ? '★ UNLOCKED' : 'locked', cx + 104, cy + 116, 12, got ? '#7ed37e' : '#8a7a9a', 'left', '900');
  });
  button(ctx, S, 'back', 40, 736, 150, 46, '← BACK', { fill: '#5d4a68', size: 14.5 });
}

function drawPause(ctx, S) {
  drawService(ctx, S);
  ctx.fillStyle = 'rgba(16,6,16,0.6)';
  ctx.fillRect(0, 0, W, H);
  panel(ctx, 440, 250, 400, 300);
  heading(ctx, 'PAUSED', 640, 316, 34);
  button(ctx, S, 'resume', 490, 344, 300, 50, '▶  KEEP COOKING', { fill: '#2e7d32', size: 16 });
  button(ctx, S, 'restart', 490, 408, 300, 50, '↻  RESTART DAY', { fill: '#b9770e', size: 15 });
  button(ctx, S, 'quitday', 490, 472, 300, 50, '←  STAGE MAP', { fill: '#5d4a68', size: 15 });
}

function drawConfetti(ctx, S) {
  for (const p of S.confetti) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = Math.max(0, 1 - p.age / 3.2);
    ctx.fillStyle = p.color;
    ctx.fillRect(-5.5, -3.5, 11, 7);
    ctx.restore();
  }
}

function drawSummary(ctx, S) {
  drawRoom(ctx, S, { withCounter: true });
  const r = S.result;
  ctx.fillStyle = 'rgba(16,6,16,0.45)';
  ctx.fillRect(0, 0, W, H);
  drawConfetti(ctx, S);
  panel(ctx, 340, 108, 600, 560);
  if (r.won) {
    heading(ctx, r.campaignWon ? '🎉 THE DINER IS YOURS! 🎉' : 'DAY COMPLETE!', 640, 176, r.campaignWon ? 33 : 40);
    // three big stars pop in one by one
    for (let i = 0; i < 3; i++) {
      const popAt = 0.35 + i * 0.45;
      const age = S.summaryT - popAt;
      const earnedStar = i < r.stars;
      const scale = age < 0 ? 0 : age < 0.22 ? 0.4 + (age / 0.22) * 0.75 : 1.15 - Math.min(0.15, (age - 0.22) * 0.6);
      ctx.save();
      ctx.translate(640 + (i - 1) * 92, 238);
      ctx.scale(Math.max(0.001, scale), Math.max(0.001, scale));
      starShape(ctx, 0, 0, 34, earnedStar ? '#f4c542' : 'rgba(120,110,100,0.45)');
      ctx.restore();
    }
    txt(ctx, r.campaignWon ? 'Day 12 cleared — the loan is repaid and the bank hands back the keys!' : `Day ${r.day} cleared with ${r.stars} star${r.stars === 1 ? '' : 's'}!`, 640, 300, 14.5, '#fdf3e0', 'center');
  } else {
    heading(ctx, 'THE DAY FELL SHORT', 640, 176, 32);
    txt(ctx, `The bank's letter feels heavier tonight. Earned $${r.earned} of $${r.goal}.`, 640, 216, 14.5, '#e9ddf2', 'center');
    txt(ctx, 'Tip: watch for PERFECT zones, chain combos, and check the night shop for buffs.', 640, 242, 13, '#cbb8d8', 'center');
  }
  const rows = [
    ['Earned', `$${r.earned}  /  goal $${r.goal}`],
    ['Guests served', String(r.served)],
    ['PERFECT serves', String(r.perfects)],
    ['Best combo', `×${r.bestCombo}`],
    ['Walkouts', String(r.walkouts)],
    ['Loan repaid so far', `$${S.game.repaid} / $${CONFIG.LOAN_TOTAL}`],
    ['Purse', `$${purse(S.game)}`],
  ];
  rows.forEach(([k, v], i) => {
    const yy = 348 + i * 33;
    txt(ctx, k, 420, yy, 15, '#cbb8d8');
    txt(ctx, v, 860, yy, 15.5, '#ffe97a', 'right', '900', DISPLAY);
  });
  if (r.won && r.endless) button(ctx, S, 'nextwave', 380, 592, 240, 50, `🌊  WAVE ${r.wave + 1} →`, { fill: '#7b241c', size: 15.5 });
  else if (r.won) button(ctx, S, 'toshop', 380, 592, 240, 50, '🌙  NIGHT SHOP', { fill: '#7b4a9e', size: 15.5 });
  button(ctx, S, 'tomap', r.won ? 660 : 490, 592, r.won ? 240 : 300, 50, r.won ? 'STAGE MAP →' : '←  STAGE MAP', { fill: '#2e7d32', size: 15.5 });
  if (!r.won) button(ctx, S, 'retry', 490, 520, 300, 50, r.endless ? '↻  TRY THE WAVE AGAIN' : '↻  TRY DAY AGAIN', { fill: '#b3543f', size: 15.5 });
  drawPopups(ctx, S);
}

function drawShop(ctx, S) {
  const g = S.game;
  ctx.fillStyle = '#241631';
  ctx.fillRect(0, 0, W, H);
  const ng = ctx.createRadialGradient(1100, 60, 10, 1100, 60, 300);
  ng.addColorStop(0, 'rgba(200,190,255,0.25)'); ng.addColorStop(1, 'rgba(200,190,255,0)');
  ctx.fillStyle = ng; ctx.fillRect(0, 0, W, 300);
  ctx.fillStyle = '#e8e4f5'; ctx.beginPath(); ctx.arc(1150, 62, 26, 0, Math.PI * 2); ctx.fill();
  heading(ctx, '🌙  NIGHT SHOP', 420, 60, 34);
  chip(ctx, 950, 30, 250, 40, '#2e7d32', `PURSE  $${purse(g)}`, 17);
  txt(ctx, 'UPGRADES — every level is a concrete buff', 40, 108, 15.5, '#ffd94d', 'left', '900', DISPLAY);
  UPGRADES.forEach((u, i) => {
    const cx = 40 + (i % 4) * 302;
    const cy = 122 + Math.floor(i / 4) * 216;
    const lv = g.levels[u.id] || 0;
    const maxed = lv >= u.prices.length;
    panel(ctx, cx, cy, 286, 200, 'rgba(50,30,52,0.97)', maxed ? '#7ed37e' : '#c98d4b');
    iconPainter(ctx, u.icon, cx + 44, cy + 46, 56);
    txt(ctx, u.name, cx + 82, cy + 34, 15.5, '#fdf3e0', 'left', '900', DISPLAY);
    // level pips
    for (let p = 0; p < u.prices.length; p++) {
      ctx.fillStyle = p < lv ? '#f4c542' : 'rgba(255,255,255,0.18)';
      ctx.beginPath(); ctx.arc(cx + 86 + p * 20, cy + 56, 7, 0, Math.PI * 2); ctx.fill();
    }
    txt(ctx, `Lv ${lv}/${u.prices.length}`, cx + 86 + u.prices.length * 20 + 8, cy + 61, 12.5, '#f4d98a');
    txt(ctx, `Now: ${u.text(lv)}`, cx + 18, cy + 102, 13, '#b8f0b0');
    txt(ctx, maxed ? 'Fully upgraded!' : `Next: ${u.next(lv)}`, cx + 18, cy + 126, 13, maxed ? '#7ed37e' : '#e9ddf2');
    if (maxed) chip(ctx, cx + 63, cy + 146, 160, 38, '#2e7d32', '★ MAX LEVEL', 14);
    else button(ctx, S, 'buy', cx + 63, cy + 146, 160, 38, `BUY — $${u.prices[lv]}`, { fill: purse(g) >= u.prices[lv] ? '#b9770e' : '#6b5a52', size: 14, data: u.id, disabled: purse(g) < u.prices[lv] });
  });
  txt(ctx, 'DECOR — bought once, brightens the diner for good', 40, 570, 15.5, '#ffd94d', 'left', '900', DISPLAY);
  DECOR.forEach((d, i) => {
    const cx = 40 + i * 302;
    const cy = 584;
    const owned = !!g.decorOwned[d.id];
    panel(ctx, cx, cy, 286, 128, 'rgba(50,30,52,0.97)', owned ? '#7ed37e' : '#c98d4b');
    iconPainter(ctx, d.icon, cx + 42, cy + 46, 52);
    txt(ctx, d.name, cx + 78, cy + 36, 14.5, '#fdf3e0', 'left', '900', DISPLAY);
    txt(ctx, d.text, cx + 78, cy + 60, 11.5, '#cbb8d8');
    if (owned) chip(ctx, cx + 78, cy + 76, 130, 32, '#2e7d32', '✓ IN THE DINER', 12);
    else button(ctx, S, 'buydecor', cx + 78, cy + 76, 130, 32, `BUY $${d.price}`, { fill: purse(g) >= d.price ? '#b9770e' : '#6b5a52', size: 12.5, data: d.id, disabled: purse(g) < d.price });
  });
  button(ctx, S, 'shopdone', 1050, 736, 190, 46, 'DONE → MAP', { fill: '#2e7d32', size: 15 });
  // ITEM GET! celebration overlay
  if (S.itemGet) {
    const ig = S.itemGet;
    const a = Math.min(1, ig.age * 5, (1.6 - ig.age) * 3);
    ctx.save();
    ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = 'rgba(16,6,16,0.45)';
    ctx.fillRect(0, 0, W, H);
    // light rays
    ctx.translate(640, 330);
    for (let i = 0; i < 12; i++) {
      ctx.save();
      ctx.rotate((i / 12) * Math.PI * 2 + S.t * 0.7);
      ctx.fillStyle = 'rgba(255,215,90,0.13)';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(300, -26); ctx.lineTo(300, 26); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    const popScale = ig.age < 0.18 ? 0.3 + (ig.age / 0.18) * 0.85 : 1.15 - Math.min(0.15, (ig.age - 0.18) * 0.5);
    ctx.scale(popScale, popScale);
    const mg = ctx.createRadialGradient(-14, -14, 8, 0, 0, 92);
    mg.addColorStop(0, '#f9e79f'); mg.addColorStop(0.7, '#e8a83e'); mg.addColorStop(1, '#b9770e');
    ctx.fillStyle = mg;
    ctx.beginPath(); ctx.arc(0, 0, 90, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff3c9'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 90, 0, Math.PI * 2); ctx.stroke();
    iconPainter(ctx, ig.icon, 0, 0, 105);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = Math.max(0, a);
    heading(ctx, 'ITEM GET!', 640, 486, 40);
    txt(ctx, ig.name, 640, 524, 19, '#ffe97a', 'center', '900', DISPLAY);
    txt(ctx, ig.effect, 640, 552, 15.5, '#fdf3e0', 'center');
    ctx.restore();
  }
}

// ------------------------------------------------------------------ dispatcher
export function draw(ctx, S) {
  S.regions = [];
  ctx.clearRect(0, 0, W, H);
  switch (S.screen) {
    case 'title': drawTitle(ctx, S); break;
    case 'ladder': drawLadder(ctx, S); break;
    case 'story': drawStory(ctx, S); break;
    case 'intro': drawIntro(ctx, S); break;
    case 'service': drawService(ctx, S); break;
    case 'pause': drawPause(ctx, S); break;
    case 'summary': drawSummary(ctx, S); break;
    case 'shop': drawShop(ctx, S); break;
    case 'howto': drawHowto(ctx, S); break;
    case 'recipes': drawRecipes(ctx, S); break;
    case 'achievements': drawAchievements(ctx, S); break;
    default: drawTitle(ctx, S);
  }
  if (S.screen !== 'service' && S.screen !== 'pause' && S.screen !== 'summary') drawPopups(ctx, S);
}
