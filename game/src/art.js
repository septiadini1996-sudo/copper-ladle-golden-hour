// Every picture in the game is drawn here in code — no image files, no icon libraries.
// Ingredients have shaded painters with glints; finished dishes are composed in their
// proper vessels; characters are painted with gradient clothes and mood faces; the
// kitchen appliances are drawn in one consistent style with light side, shadow side,
// glints and working details (burners, grates, knobs, flames, baskets, taps).

import { ING, DRINK } from './data.js';

export function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, Math.round(((n >> 16) & 255) * f)));
  const g = Math.min(255, Math.max(0, Math.round(((n >> 8) & 255) * f)));
  const b = Math.min(255, Math.max(0, Math.round((n & 255) * f)));
  return `rgb(${r},${g},${b})`;
}
export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
export function ell(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}
function grad(ctx, x, y, w, h, c1, c2) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  return g;
}
function glint(ctx, x, y, s) {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ell(ctx, x, y, s * 0.16, s * 0.08);
  ctx.fill();
  ctx.restore();
}

// ------------------------------------------------------------------ ingredients
// One painter per shape; each ingredient picks its shape and colours from data.js.
const SHAPES = {
  dome(ctx, x, y, s, c) { // sesame bun
    ctx.fillStyle = grad(ctx, x, y - s * 0.3, s, s * 0.6, shade(c, 1.25), shade(c, 0.8));
    ctx.beginPath(); ctx.arc(x, y + s * 0.12, s * 0.42, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#f7e3b0';
    for (const [dx, dy] of [[-0.2, -0.14], [0.02, -0.22], [0.22, -0.1], [-0.08, -0.04], [0.14, -0.2]]) {
      ell(ctx, x + dx * s, y + dy * s, s * 0.035, s * 0.02); ctx.fill();
    }
    glint(ctx, x - s * 0.18, y - s * 0.16, s);
  },
  loaf(ctx, x, y, s, c) {
    ctx.fillStyle = grad(ctx, x, y - s * 0.25, s, s * 0.5, shade(c, 1.2), shade(c, 0.78));
    rr(ctx, x - s * 0.42, y - s * 0.22, s * 0.84, s * 0.44, s * 0.16); ctx.fill();
    ctx.strokeStyle = shade(c, 0.6); ctx.lineWidth = s * 0.03;
    for (const dx of [-0.2, 0, 0.2]) { ctx.beginPath(); ctx.moveTo(x + dx * s - s * 0.05, y - s * 0.2); ctx.lineTo(x + dx * s + s * 0.05, y - s * 0.02); ctx.stroke(); }
    glint(ctx, x - s * 0.24, y - s * 0.14, s);
  },
  patty(ctx, x, y, s, c) {
    ctx.fillStyle = grad(ctx, x, y - s * 0.2, s, s * 0.4, shade(c, 1.15), shade(c, 0.7));
    ell(ctx, x, y, s * 0.44, s * 0.2); ctx.fill();
    ctx.fillStyle = shade(c, 0.55);
    for (const [dx, dy] of [[-0.2, -0.05], [0.1, 0.04], [0.24, -0.06], [-0.02, -0.1]]) { ell(ctx, x + dx * s, y + dy * s, s * 0.05, s * 0.03); ctx.fill(); }
    glint(ctx, x - s * 0.22, y - s * 0.1, s);
  },
  steak(ctx, x, y, s, c) {
    ctx.fillStyle = grad(ctx, x, y - s * 0.25, s, s * 0.5, shade(c, 1.2), shade(c, 0.72));
    ctx.beginPath();
    ctx.moveTo(x - s * 0.4, y - s * 0.1); ctx.quadraticCurveTo(x - s * 0.44, y - s * 0.3, x - s * 0.1, y - s * 0.28);
    ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.34, x + s * 0.42, y - s * 0.02);
    ctx.quadraticCurveTo(x + s * 0.44, y + s * 0.24, x + s * 0.08, y + s * 0.22);
    ctx.quadraticCurveTo(x - s * 0.38, y + s * 0.26, x - s * 0.4, y - s * 0.1); ctx.fill();
    ctx.fillStyle = '#f3c6a5'; ell(ctx, x + s * 0.02, y - s * 0.02, s * 0.2, s * 0.1); ctx.fill();
    ctx.strokeStyle = shade(c, 0.55); ctx.lineWidth = s * 0.035;
    for (const dx of [-0.16, 0.04, 0.22]) { ctx.beginPath(); ctx.moveTo(x + dx * s, y - s * 0.2); ctx.lineTo(x + dx * s - s * 0.06, y + s * 0.14); ctx.stroke(); }
    glint(ctx, x - s * 0.2, y - s * 0.16, s);
  },
  wedge(ctx, x, y, s, c) { // holed cheese wedge
    ctx.fillStyle = grad(ctx, x, y - s * 0.25, s, s * 0.5, shade(c, 1.18), shade(c, 0.82));
    ctx.beginPath(); ctx.moveTo(x - s * 0.42, y + s * 0.2); ctx.lineTo(x + s * 0.42, y + s * 0.2); ctx.lineTo(x + s * 0.1, y - s * 0.26); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(c, 0.72);
    for (const [dx, dy, r] of [[-0.12, 0.06, 0.07], [0.14, 0.1, 0.05], [0.02, -0.08, 0.045]]) { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); ctx.fill(); }
  },
  leaf(ctx, x, y, s, c) {
    ctx.fillStyle = grad(ctx, x, y - s * 0.3, s, s * 0.6, shade(c, 1.3), shade(c, 0.8));
    for (const a of [-0.35, 0, 0.35]) {
      ctx.save(); ctx.translate(x, y + s * 0.1); ctx.rotate(a);
      ell(ctx, 0, -s * 0.12, s * 0.16, s * 0.3); ctx.fill(); ctx.restore();
    }
    ctx.strokeStyle = shade(c, 0.6); ctx.lineWidth = s * 0.03;
    ctx.beginPath(); ctx.moveTo(x, y + s * 0.22); ctx.lineTo(x, y - s * 0.3); ctx.stroke();
  },
  round(ctx, x, y, s, c) { // tomato / onion slice / fruit
    const g = ctx.createRadialGradient(x - s * 0.12, y - s * 0.12, s * 0.05, x, y, s * 0.42);
    g.addColorStop(0, shade(c, 1.3)); g.addColorStop(1, shade(c, 0.78));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, s * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = shade(c, 0.62); ctx.lineWidth = s * 0.035;
    ctx.beginPath(); ctx.arc(x, y, s * 0.27, 0, Math.PI * 2); ctx.stroke();
    glint(ctx, x - s * 0.14, y - s * 0.16, s);
  },
  tomato(ctx, x, y, s, c) {
    SHAPES.round(ctx, x, y, s, c);
    ctx.fillStyle = '#3f7d33';
    ctx.beginPath(); ctx.moveTo(x - s * 0.14, y - s * 0.36); ctx.lineTo(x, y - s * 0.46); ctx.lineTo(x + s * 0.14, y - s * 0.36); ctx.lineTo(x + s * 0.05, y - s * 0.28); ctx.lineTo(x - s * 0.05, y - s * 0.28); ctx.closePath(); ctx.fill();
  },
  rings(ctx, x, y, s, c) {
    ctx.strokeStyle = shade(c, 0.95); ctx.lineWidth = s * 0.09;
    for (const [dx, dy, r] of [[-0.14, 0.02, 0.2], [0.14, -0.04, 0.17], [0.02, 0.14, 0.15]]) {
      ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.strokeStyle = shade(c, 1.3); ctx.lineWidth = s * 0.03;
    ctx.beginPath(); ctx.arc(x - s * 0.14, y, s * 0.2, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke();
  },
  egg(ctx, x, y, s, c) {
    ctx.fillStyle = '#fdf6e3'; ell(ctx, x, y, s * 0.42, s * 0.3); ctx.fill();
    ctx.strokeStyle = '#e8d9b0'; ctx.lineWidth = s * 0.03; ell(ctx, x, y, s * 0.42, s * 0.3); ctx.stroke();
    const g = ctx.createRadialGradient(x - s * 0.05, y - s * 0.06, s * 0.03, x, y, s * 0.2);
    g.addColorStop(0, '#ffd970'); g.addColorStop(1, c);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, s * 0.19, 0, Math.PI * 2); ctx.fill();
    glint(ctx, x - s * 0.06, y - s * 0.08, s * 0.7);
  },
  wavy(ctx, x, y, s, c) { // bacon
    ctx.lineCap = 'round';
    for (const off of [-0.16, 0.12]) {
      ctx.strokeStyle = shade(c, 0.9); ctx.lineWidth = s * 0.17;
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) { const px = x - s * 0.36 + (i / 10) * s * 0.72; const py = y + off * s + Math.sin(i * 1.4) * s * 0.07; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke();
      ctx.strokeStyle = '#f6c9a0'; ctx.lineWidth = s * 0.05;
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) { const px = x - s * 0.36 + (i / 10) * s * 0.72; const py = y + off * s + Math.sin(i * 1.4) * s * 0.07; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke();
    }
  },
  drum(ctx, x, y, s, c) { // chicken leg
    ctx.fillStyle = grad(ctx, x, y - s * 0.2, s, s * 0.5, shade(c, 1.22), shade(c, 0.75));
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.5); ell(ctx, 0, -s * 0.05, s * 0.26, s * 0.32); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#f3e6cf'; ell(ctx, x + s * 0.2, y + s * 0.22, s * 0.09, s * 0.07); ctx.fill(); ell(ctx, x + s * 0.3, y + s * 0.16, s * 0.07, s * 0.09); ctx.fill();
    glint(ctx, x - s * 0.12, y - s * 0.2, s);
  },
  fish(ctx, x, y, s, c) {
    ctx.fillStyle = grad(ctx, x, y - s * 0.25, s, s * 0.5, shade(c, 1.3), shade(c, 0.75));
    ctx.beginPath(); ctx.moveTo(x - s * 0.42, y); ctx.quadraticCurveTo(x - s * 0.05, y - s * 0.3, x + s * 0.26, y - s * 0.05);
    ctx.lineTo(x + s * 0.44, y - s * 0.2); ctx.lineTo(x + s * 0.4, y); ctx.lineTo(x + s * 0.44, y + s * 0.2); ctx.lineTo(x + s * 0.26, y + s * 0.05);
    ctx.quadraticCurveTo(x - s * 0.05, y + s * 0.3, x - s * 0.42, y); ctx.fill();
    ctx.fillStyle = '#26303a'; ctx.beginPath(); ctx.arc(x - s * 0.26, y - s * 0.04, s * 0.04, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = shade(c, 0.6); ctx.lineWidth = s * 0.03;
    for (const dx of [-0.05, 0.08]) { ctx.beginPath(); ctx.arc(x + dx * s, y, s * 0.1, -1.1, 1.1); ctx.stroke(); }
    glint(ctx, x - s * 0.1, y - s * 0.14, s);
  },
  shrimp(ctx, x, y, s, c) {
    ctx.strokeStyle = shade(c, 0.95); ctx.lineWidth = s * 0.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, s * 0.22, Math.PI * 0.3, Math.PI * 1.75); ctx.stroke();
    ctx.strokeStyle = shade(c, 0.6); ctx.lineWidth = s * 0.035;
    for (const a of [0.7, 1.2, 1.7]) { ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * s * 0.1, y + Math.sin(a) * s * 0.1); ctx.lineTo(x + Math.cos(a) * s * 0.34, y + Math.sin(a) * s * 0.34); ctx.stroke(); }
    ctx.fillStyle = shade(c, 1.25); ell(ctx, x + s * 0.2, y - s * 0.2, s * 0.07, s * 0.12); ctx.fill();
  },
  noodle(ctx, x, y, s, c) {
    ctx.strokeStyle = shade(c, 0.95); ctx.lineWidth = s * 0.055; ctx.lineCap = 'round';
    for (const off of [-0.14, 0, 0.14]) {
      ctx.beginPath();
      for (let i = 0; i <= 12; i++) { const px = x - s * 0.36 + (i / 12) * s * 0.72; const py = y + off * s + Math.sin(i * 1.1 + off * 9) * s * 0.05; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke();
    }
    ctx.strokeStyle = shade(c, 1.3); ctx.lineWidth = s * 0.02;
    ctx.beginPath(); ctx.moveTo(x - s * 0.3, y - s * 0.16); ctx.lineTo(x + s * 0.1, y - s * 0.16); ctx.stroke();
  },
  pasta(ctx, x, y, s, c) {
    ctx.strokeStyle = shade(c, 0.95); ctx.lineWidth = s * 0.06; ctx.lineCap = 'round';
    for (const dx of [-0.24, -0.08, 0.08, 0.24]) { ctx.beginPath(); ctx.moveTo(x + dx * s, y - s * 0.26); ctx.lineTo(x + dx * s + s * 0.05, y + s * 0.26); ctx.stroke(); }
    ctx.fillStyle = '#c0392b'; ell(ctx, x - s * 0.12, y - s * 0.05, s * 0.09, s * 0.07); ctx.fill(); ell(ctx, x + s * 0.16, y + s * 0.1, s * 0.08, s * 0.06); ctx.fill();
  },
  grain(ctx, x, y, s, c) { // rice mound
    ctx.fillStyle = grad(ctx, x, y - s * 0.25, s, s * 0.5, '#ffffff', shade(c, 0.85));
    ctx.beginPath(); ctx.arc(x, y + s * 0.14, s * 0.4, Math.PI, 0); ctx.fill();
    ctx.fillStyle = shade(c, 0.8);
    for (const [dx, dy] of [[-0.18, -0.06], [0.05, -0.16], [0.2, -0.02], [-0.02, 0.02]]) { ell(ctx, x + dx * s, y + dy * s, s * 0.05, s * 0.025); ctx.fill(); }
  },
  pot(ctx, x, y, s, c) { // broth
    ctx.fillStyle = grad(ctx, x, y - s * 0.1, s, s * 0.45, shade(c, 1.2), shade(c, 0.8));
    ell(ctx, x, y - s * 0.08, s * 0.4, s * 0.14); ctx.fill();
    ctx.fillStyle = shade(c, 0.65);
    ell(ctx, x - s * 0.14, y - s * 0.1, s * 0.06, s * 0.03); ctx.fill(); ell(ctx, x + s * 0.12, y - s * 0.06, s * 0.05, s * 0.025); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = s * 0.03;
    ctx.beginPath(); ctx.moveTo(x - s * 0.08, y - s * 0.3); ctx.quadraticCurveTo(x - s * 0.14, y - s * 0.42, x - s * 0.06, y - s * 0.5); ctx.stroke();
  },
  shroom(ctx, x, y, s, c) {
    ctx.fillStyle = grad(ctx, x, y - s * 0.3, s, s * 0.4, shade(c, 1.25), shade(c, 0.8));
    ctx.beginPath(); ctx.arc(x, y - s * 0.02, s * 0.36, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#f0e2c8'; rr(ctx, x - s * 0.09, y, s * 0.18, s * 0.26, s * 0.05); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ell(ctx, x - s * 0.15, y - s * 0.16, s * 0.05, s * 0.03); ctx.fill(); ell(ctx, x + s * 0.12, y - s * 0.22, s * 0.04, s * 0.025); ctx.fill();
  },
  carrot(ctx, x, y, s, c) {
    ctx.fillStyle = grad(ctx, x, y - s * 0.2, s, s * 0.55, shade(c, 1.2), shade(c, 0.78));
    ctx.beginPath(); ctx.moveTo(x - s * 0.3, y - s * 0.18); ctx.lineTo(x + s * 0.28, y - s * 0.2); ctx.lineTo(x + s * 0.02, y + s * 0.34); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#3f7d33'; ctx.lineWidth = s * 0.05; ctx.lineCap = 'round';
    for (const dx of [-0.1, 0.04, 0.16]) { ctx.beginPath(); ctx.moveTo(x + dx * s, y - s * 0.2); ctx.lineTo(x + dx * s - s * 0.03, y - s * 0.4); ctx.stroke(); }
    ctx.strokeStyle = shade(c, 0.65); ctx.lineWidth = s * 0.03;
    ctx.beginPath(); ctx.moveTo(x - s * 0.12, y - s * 0.02); ctx.lineTo(x + s * 0.08, y - s * 0.02); ctx.stroke();
  },
  fries(ctx, x, y, s, c) {
    ctx.fillStyle = grad(ctx, x, y - s * 0.35, s, s * 0.6, shade(c, 1.2), shade(c, 0.82));
    for (const [dx, h, tilt] of [[-0.24, 0.55, -0.1], [-0.08, 0.68, 0.03], [0.08, 0.6, -0.04], [0.24, 0.5, 0.1]]) {
      ctx.save(); ctx.translate(x + dx * s, y + s * 0.2); ctx.rotate(tilt); rr(ctx, -s * 0.055, -h * s, s * 0.11, h * s, s * 0.03); ctx.fill(); ctx.restore();
    }
    ctx.fillStyle = '#b03a2e'; ctx.beginPath(); ctx.moveTo(x - s * 0.3, y - s * 0.02); ctx.lineTo(x + s * 0.3, y - s * 0.02); ctx.lineTo(x + s * 0.22, y + s * 0.3); ctx.lineTo(x - s * 0.22, y + s * 0.3); ctx.closePath(); ctx.fill();
  },
  dough(ctx, x, y, s, c) { // pancake stack
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = grad(ctx, x, y - s * 0.1 + i * s * 0.13, s, s * 0.16, shade(c, 1.18 - i * 0.06), shade(c, 0.85));
      ell(ctx, x, y + s * 0.16 - i * s * 0.13, s * 0.4, s * 0.11); ctx.fill();
    }
    ctx.fillStyle = '#f7d774'; rr(ctx, x - s * 0.07, y - s * 0.3, s * 0.14, s * 0.09, s * 0.03); ctx.fill();
    ctx.strokeStyle = '#b06a28'; ctx.lineWidth = s * 0.035;
    ctx.beginPath(); ctx.moveTo(x + s * 0.05, y - s * 0.22); ctx.quadraticCurveTo(x + s * 0.3, y - s * 0.05, x + s * 0.26, y + s * 0.14); ctx.stroke();
  },
  sausage(ctx, x, y, s, c) {
    ctx.strokeStyle = shade(c, 0.92); ctx.lineWidth = s * 0.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y + s * 0.05, s * 0.24, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - s * 0.26, y + s * 0.28); ctx.lineTo(x + s * 0.26, y + s * 0.28); ctx.stroke();
    ctx.strokeStyle = shade(c, 1.35); ctx.lineWidth = s * 0.045;
    ctx.beginPath(); ctx.arc(x, y + s * 0.05, s * 0.24, Math.PI * 1.2, Math.PI * 1.55); ctx.stroke();
  },
  avo(ctx, x, y, s, c) {
    ctx.fillStyle = shade(c, 0.62);
    ctx.beginPath(); ctx.moveTo(x, y - s * 0.4); ctx.quadraticCurveTo(x + s * 0.34, y - s * 0.05, x + s * 0.3, y + s * 0.14);
    ctx.quadraticCurveTo(x + s * 0.26, y + s * 0.38, x, y + s * 0.38); ctx.quadraticCurveTo(x - s * 0.26, y + s * 0.38, x - s * 0.3, y + s * 0.14);
    ctx.quadraticCurveTo(x - s * 0.34, y - s * 0.05, x, y - s * 0.4); ctx.fill();
    ctx.fillStyle = '#cfe08a';
    ctx.beginPath(); ctx.moveTo(x, y - s * 0.3); ctx.quadraticCurveTo(x + s * 0.24, y, x + s * 0.2, y + s * 0.12);
    ctx.quadraticCurveTo(x + s * 0.17, y + s * 0.3, x, y + s * 0.3); ctx.quadraticCurveTo(x - s * 0.17, y + s * 0.3, x - s * 0.2, y + s * 0.12);
    ctx.quadraticCurveTo(x - s * 0.24, y, x, y - s * 0.3); ctx.fill();
    ctx.fillStyle = '#7a4a21'; ctx.beginPath(); ctx.arc(x, y + s * 0.1, s * 0.11, 0, Math.PI * 2); ctx.fill();
  },
  pepper(ctx, x, y, s, c) {
    ctx.fillStyle = grad(ctx, x, y - s * 0.3, s, s * 0.6, shade(c, 1.25), shade(c, 0.78));
    ctx.beginPath(); ctx.moveTo(x - s * 0.24, y - s * 0.22); ctx.quadraticCurveTo(x - s * 0.36, y + s * 0.1, x - s * 0.2, y + s * 0.3);
    ctx.lineTo(x + s * 0.2, y + s * 0.3); ctx.quadraticCurveTo(x + s * 0.36, y + s * 0.1, x + s * 0.24, y - s * 0.22); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3f7d33'; rr(ctx, x - s * 0.1, y - s * 0.38, s * 0.2, s * 0.14, s * 0.05); ctx.fill();
    glint(ctx, x - s * 0.14, y - s * 0.05, s);
  },
  berries(ctx, x, y, s, c) {
    for (const [dx, dy, cc] of [[-0.16, 0.06, c], [0.14, 0.1, '#7d3c98'], [0, -0.14, c], [0.2, -0.1, '#943126']]) {
      const g = ctx.createRadialGradient(x + dx * s - s * 0.04, y + dy * s - s * 0.04, s * 0.02, x + dx * s, y + dy * s, s * 0.15);
      g.addColorStop(0, shade(cc, 1.35)); g.addColorStop(1, shade(cc, 0.75));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, s * 0.14, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#3f7d33'; ell(ctx, x - s * 0.05, y - s * 0.26, s * 0.12, s * 0.05); ctx.fill();
  },
  swirl(ctx, x, y, s, c) { // whipped cream
    ctx.fillStyle = grad(ctx, x, y - s * 0.35, s, s * 0.7, '#ffffff', shade(c, 0.8));
    ctx.beginPath(); ctx.moveTo(x - s * 0.34, y + s * 0.26); ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.05, x - s * 0.18, y - s * 0.08);
    ctx.quadraticCurveTo(x - s * 0.3, y - s * 0.3, x - s * 0.05, y - s * 0.26); ctx.quadraticCurveTo(x, y - s * 0.46, x + s * 0.1, y - s * 0.28);
    ctx.quadraticCurveTo(x + s * 0.34, y - s * 0.26, x + s * 0.24, y - s * 0.04); ctx.quadraticCurveTo(x + s * 0.4, y + s * 0.12, x + s * 0.34, y + s * 0.26); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(x + s * 0.06, y - s * 0.34, s * 0.07, 0, Math.PI * 2); ctx.fill();
  },
  jar(ctx, x, y, s, c) { // honey
    ctx.fillStyle = grad(ctx, x, y - s * 0.3, s, s * 0.6, shade(c, 1.2), shade(c, 0.85));
    rr(ctx, x - s * 0.26, y - s * 0.2, s * 0.52, s * 0.5, s * 0.12); ctx.fill();
    ctx.fillStyle = '#8a5a1d'; rr(ctx, x - s * 0.28, y - s * 0.34, s * 0.56, s * 0.13, s * 0.05); ctx.fill();
    glint(ctx, x - s * 0.14, y - s * 0.05, s);
  },
  bar(ctx, x, y, s, c) { // chocolate
    ctx.fillStyle = grad(ctx, x, y - s * 0.25, s, s * 0.5, shade(c, 1.25), shade(c, 0.8));
    rr(ctx, x - s * 0.36, y - s * 0.24, s * 0.72, s * 0.48, s * 0.06); ctx.fill();
    ctx.strokeStyle = shade(c, 0.55); ctx.lineWidth = s * 0.03;
    for (const dx of [-0.12, 0.12]) { ctx.beginPath(); ctx.moveTo(x + dx * s, y - s * 0.24); ctx.lineTo(x + dx * s, y + s * 0.24); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(x - s * 0.36, y); ctx.lineTo(x + s * 0.36, y); ctx.stroke();
  },
};

/** Draw one ingredient, shaded; `cooked` adds a sear sheen. */
export function ingredientPainter(ctx, id, x, y, s, cooked = false) {
  const ing = ING[id];
  ctx.save();
  (SHAPES[ing.shape] || SHAPES.round)(ctx, x, y, s, ing.c1);
  if (cooked && ing.cook > 0) {
    ctx.fillStyle = 'rgba(120,60,10,0.16)';
    ell(ctx, x, y + s * 0.08, s * 0.4, s * 0.22); ctx.fill();
    glint(ctx, x + s * 0.16, y - s * 0.12, s * 0.8);
  }
  ctx.restore();
}

export function drinkPainter(ctx, id, x, y, s) {
  const d = DRINK[id];
  ctx.save();
  ctx.fillStyle = 'rgba(240,248,255,0.85)';
  ctx.beginPath(); ctx.moveTo(x - s * 0.26, y - s * 0.3); ctx.lineTo(x + s * 0.26, y - s * 0.3); ctx.lineTo(x + s * 0.2, y + s * 0.32); ctx.lineTo(x - s * 0.2, y + s * 0.32); ctx.closePath(); ctx.fill();
  ctx.fillStyle = d.c1;
  ctx.beginPath(); ctx.moveTo(x - s * 0.22, y - s * 0.18); ctx.lineTo(x + s * 0.22, y - s * 0.18); ctx.lineTo(x + s * 0.18, y + s * 0.28); ctx.lineTo(x - s * 0.18, y + s * 0.28); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#e67e22'; ctx.lineWidth = s * 0.06; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x + s * 0.05, y - s * 0.28); ctx.lineTo(x + s * 0.2, y - s * 0.48); ctx.stroke();
  glint(ctx, x - s * 0.12, y - s * 0.05, s);
  ctx.restore();
}

// ------------------------------------------------------------------ dishes
function vessel(ctx, kind, x, y, s) {
  if (kind === 'bowl') {
    ctx.fillStyle = grad(ctx, x, y, s, s * 0.5, '#7fb3d5', '#2e5f7a');
    ctx.beginPath(); ctx.arc(x, y - s * 0.05, s * 0.46, 0.15 * Math.PI, 0.85 * Math.PI); ctx.fill();
    ctx.fillStyle = '#aed6f1'; ell(ctx, x, y - s * 0.05, s * 0.46, s * 0.1); ctx.fill();
    ctx.fillStyle = '#f5deb3'; ell(ctx, x, y - s * 0.05, s * 0.4, s * 0.08); ctx.fill();
  } else if (kind === 'board') {
    ctx.fillStyle = grad(ctx, x, y - s * 0.2, s, s * 0.45, '#c98d4b', '#8a5a24');
    rr(ctx, x - s * 0.52, y - s * 0.2, s * 1.04, s * 0.42, s * 0.1); ctx.fill();
    ctx.strokeStyle = 'rgba(90,50,10,0.35)'; ctx.lineWidth = s * 0.02;
    ctx.beginPath(); ctx.moveTo(x - s * 0.46, y - s * 0.02); ctx.lineTo(x + s * 0.46, y - s * 0.02); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - s * 0.46, y + s * 0.1); ctx.lineTo(x + s * 0.46, y + s * 0.1); ctx.stroke();
  } else { // plate
    ctx.fillStyle = '#f4f6f7'; ell(ctx, x, y + s * 0.08, s * 0.52, s * 0.2); ctx.fill();
    ctx.fillStyle = '#dfe6e9'; ell(ctx, x, y + s * 0.08, s * 0.4, s * 0.14); ctx.fill();
    ctx.strokeStyle = '#b8c6cc'; ctx.lineWidth = s * 0.02; ell(ctx, x, y + s * 0.08, s * 0.52, s * 0.2); ctx.stroke();
  }
}
function steam(ctx, x, y, s, t) {
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = s * 0.045; ctx.lineCap = 'round';
  for (const dx of [-0.18, 0.05, 0.26]) {
    const wob = Math.sin(t * 2.4 + dx * 9) * s * 0.03;
    ctx.beginPath(); ctx.moveTo(x + dx * s + wob, y - s * 0.3);
    ctx.quadraticCurveTo(x + dx * s - wob, y - s * 0.48, x + dx * s + wob, y - s * 0.62); ctx.stroke();
  }
}

/**
 * Draw a dish: the vessel plus exactly the placed ingredient layers, in recipe order.
 * When finished, the composition becomes the recipe's dedicated finished illustration
 * (composed stack for burgers, arranged minis in the vessel otherwise) with garnish.
 */
export function drawDish(ctx, recipe, placedIds, x, y, s, t = 0, finished = false) {
  ctx.save();
  const kind = recipe.vessel;
  if (kind === 'burger') {
    const layers = finished ? recipe.steps : placedIds;
    // bottom bun
    ctx.fillStyle = grad(ctx, x, y + s * 0.1, s, s * 0.2, '#e8a856', '#b06a28');
    ell(ctx, x, y + s * 0.24, s * 0.42, s * 0.12); ctx.fill();
    let ly = y + s * 0.18;
    const rest = layers.filter((id) => id !== 'bun');
    for (const id of rest) {
      ctx.save(); ctx.translate(x, ly); ctx.scale(1, 0.52); ingredientPainter(ctx, id, 0, 0, s * 0.95, ING[id].cook > 0); ctx.restore();
      ly -= s * 0.105;
    }
    if (finished || layers.includes('bun')) {
      ctx.save(); ctx.translate(x, ly - s * 0.02); ctx.scale(1, 0.9); SHAPES.dome(ctx, 0, 0, s * 0.95, '#e8a856'); ctx.restore();
    }
    if (finished) { steam(ctx, x, y - s * 0.1, s, t); }
    ctx.restore();
    return;
  }
  vessel(ctx, kind, x, y, s);
  const layers = finished ? recipe.steps : placedIds;
  const spots = [[-0.2, -0.06], [0.18, -0.1], [0, 0.06], [-0.14, 0.12], [0.22, 0.1], [-0.02, -0.16]];
  layers.forEach((id, i) => {
    const [dx, dy] = spots[i % spots.length];
    ingredientPainter(ctx, id, x + dx * s, y + dy * s - s * 0.02, s * (finished ? 0.52 : 0.46), ING[id].cook > 0);
  });
  if (finished) {
    ctx.fillStyle = '#3f7d33'; // parsley garnish flecks
    for (const [dx, dy] of [[-0.26, -0.14], [0.3, -0.02], [0.06, -0.2]]) { ell(ctx, x + dx * s, y + dy * s, s * 0.035, s * 0.018); ctx.fill(); }
    if (recipe.steps.some((id) => ING[id].cook > 0)) steam(ctx, x, y, s, t);
  }
  ctx.restore();
}

// ------------------------------------------------------------------ characters
const SKIN = ['#f6cfa5', '#e8b07e', '#c98a54', '#8a5a33'];
export function characterPainter(ctx, type, x, y, s, mood = 'hi', skinTone = 0) {
  const skin = type.skin || SKIN[skinTone % SKIN.length];
  const cloth = type.color || type.cloth || '#5d7a9e';
  ctx.save();
  // body: gradient clothing with a light side and a shadow side
  const bodyG = ctx.createLinearGradient(x - s * 0.3, y, x + s * 0.3, y);
  bodyG.addColorStop(0, shade(cloth, 1.18)); bodyG.addColorStop(0.55, cloth); bodyG.addColorStop(1, shade(cloth, 0.68));
  ctx.fillStyle = bodyG;
  ctx.beginPath();
  ctx.moveTo(x - s * 0.3, y + s * 0.62); ctx.quadraticCurveTo(x - s * 0.26, y + s * 0.05, x - s * 0.13, y - s * 0.05);
  ctx.lineTo(x + s * 0.13, y - s * 0.05); ctx.quadraticCurveTo(x + s * 0.26, y + s * 0.05, x + s * 0.3, y + s * 0.62); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; // collar
  ctx.beginPath(); ctx.moveTo(x - s * 0.09, y - s * 0.04); ctx.lineTo(x, y + s * 0.08); ctx.lineTo(x + s * 0.09, y - s * 0.04); ctx.lineTo(x + s * 0.05, y - s * 0.1); ctx.lineTo(x - s * 0.05, y - s * 0.1); ctx.closePath(); ctx.fill();
  ctx.fillStyle = shade(cloth, 0.6);
  for (const dy of [0.2, 0.36]) { ctx.beginPath(); ctx.arc(x, y + s * dy, s * 0.025, 0, Math.PI * 2); ctx.fill(); }
  // head
  const hg = ctx.createRadialGradient(x - s * 0.08, y - s * 0.34, s * 0.05, x, y - s * 0.26, s * 0.24);
  hg.addColorStop(0, shade(skin, 1.12)); hg.addColorStop(1, shade(skin, 0.88));
  ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(x, y - s * 0.26, s * 0.21, 0, Math.PI * 2); ctx.fill();
  // hair / headgear by type
  ctx.fillStyle = type.hair;
  if (type.id === 'auntie') {
    ctx.beginPath(); ctx.arc(x, y - s * 0.44, s * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, y - s * 0.3, s * 0.215, Math.PI * 1.05, Math.PI * 1.95); ctx.lineTo(x + s * 0.2, y - s * 0.3); ctx.lineTo(x - s * 0.2, y - s * 0.3); ctx.fill();
  } else if (type.id === 'tourist') {
    ctx.fillStyle = '#e67e22'; ctx.beginPath(); ctx.arc(x, y - s * 0.3, s * 0.22, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#d35400'; ell(ctx, x, y - s * 0.29, s * 0.3, s * 0.05); ctx.fill();
  } else if (type.id === 'grandpa') {
    ctx.fillStyle = '#ecf0f1';
    ctx.beginPath(); ctx.arc(x - s * 0.19, y - s * 0.32, s * 0.07, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + s * 0.19, y - s * 0.32, s * 0.07, 0, Math.PI * 2); ctx.fill();
    rr(ctx, x - s * 0.11, y - s * 0.13, s * 0.22, s * 0.06, s * 0.03); ctx.fill(); // moustache
  } else if (type.id === 'kid') {
    for (const dx of [-0.12, 0, 0.12]) { ctx.beginPath(); ctx.arc(x + dx * s, y - s * 0.44, s * 0.055, 0, Math.PI * 2); ctx.fill(); }
    ctx.beginPath(); ctx.arc(x, y - s * 0.31, s * 0.215, Math.PI * 1.1, Math.PI * 1.9); ctx.lineTo(x + s * 0.19, y - s * 0.3); ctx.lineTo(x - s * 0.19, y - s * 0.3); ctx.fill();
  } else if (type.id === 'critic') {
    ctx.beginPath(); ctx.arc(x, y - s * 0.31, s * 0.215, Math.PI * 1.05, Math.PI * 1.95); ctx.lineTo(x + s * 0.2, y - s * 0.3); ctx.lineTo(x - s * 0.2, y - s * 0.3); ctx.fill();
    ctx.strokeStyle = '#2c3e50'; ctx.lineWidth = s * 0.025;
    for (const dx of [-0.09, 0.09]) { ctx.beginPath(); ctx.arc(x + dx * s, y - s * 0.26, s * 0.06, 0, Math.PI * 2); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(x - s * 0.03, y - s * 0.26); ctx.lineTo(x + s * 0.03, y - s * 0.26); ctx.stroke();
  } else if (type.id === 'marco') {
    ctx.beginPath(); ctx.arc(x, y - s * 0.31, s * 0.215, Math.PI * 1.05, Math.PI * 1.95); ctx.lineTo(x + s * 0.2, y - s * 0.3); ctx.lineTo(x - s * 0.2, y - s * 0.3); ctx.fill();
    rr(ctx, x - s * 0.12, y - s * 0.12, s * 0.24, s * 0.07, s * 0.035); ctx.fillStyle = type.hair; ctx.fill(); // moustache
  } else {
    ctx.beginPath(); ctx.arc(x, y - s * 0.31, s * 0.215, Math.PI * 1.05, Math.PI * 1.95); ctx.lineTo(x + s * 0.2, y - s * 0.3); ctx.lineTo(x - s * 0.2, y - s * 0.3); ctx.fill();
  }
  // face by mood
  ctx.fillStyle = '#2c2118';
  const ey = y - s * 0.27;
  if (mood === 'happy') {
    ctx.strokeStyle = '#2c2118'; ctx.lineWidth = s * 0.028; ctx.lineCap = 'round';
    for (const dx of [-0.08, 0.08]) { ctx.beginPath(); ctx.arc(x + dx * s, ey + s * 0.01, s * 0.035, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
  } else {
    for (const dx of [-0.08, 0.08]) { ctx.beginPath(); ctx.arc(x + dx * s, ey, s * 0.026, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.strokeStyle = '#2c2118'; ctx.lineWidth = s * 0.03; ctx.lineCap = 'round';
  ctx.beginPath();
  if (mood === 'happy' || mood === 'hi') ctx.arc(x, y - s * 0.18, s * 0.07, Math.PI * 0.15, Math.PI * 0.85);
  else if (mood === 'angry') ctx.arc(x, y - s * 0.08, s * 0.06, Math.PI * 1.15, Math.PI * 1.85);
  else { ctx.moveTo(x - s * 0.05, y - s * 0.14); ctx.lineTo(x + s * 0.05, y - s * 0.14); }
  ctx.stroke();
  if (mood === 'angry') { // furrowed brows
    ctx.beginPath(); ctx.moveTo(x - s * 0.13, y - s * 0.35); ctx.lineTo(x - s * 0.04, y - s * 0.31); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + s * 0.13, y - s * 0.35); ctx.lineTo(x + s * 0.04, y - s * 0.31); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(231,110,90,0.35)'; // blush
  ell(ctx, x - s * 0.13, y - s * 0.19, s * 0.04, s * 0.025); ctx.fill();
  ell(ctx, x + s * 0.13, y - s * 0.19, s * 0.04, s * 0.025); ctx.fill();
  ctx.restore();
}

export function rosaPainter(ctx, x, y, s) {
  ctx.save();
  const bodyG = ctx.createLinearGradient(x - s * 0.3, y, x + s * 0.3, y);
  bodyG.addColorStop(0, '#fdfefe'); bodyG.addColorStop(0.6, '#f4f6f7'); bodyG.addColorStop(1, '#ccd4d8');
  ctx.fillStyle = bodyG;
  ctx.beginPath(); ctx.moveTo(x - s * 0.3, y + s * 0.62); ctx.quadraticCurveTo(x - s * 0.26, y, x - s * 0.12, y - s * 0.04);
  ctx.lineTo(x + s * 0.12, y - s * 0.04); ctx.quadraticCurveTo(x + s * 0.26, y, x + s * 0.3, y + s * 0.62); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#b3543f'; rr(ctx, x - s * 0.17, y + s * 0.08, s * 0.34, s * 0.5, s * 0.05); ctx.fill(); // apron
  ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.moveTo(x - s * 0.1, y - s * 0.05); ctx.lineTo(x, y + s * 0.05); ctx.lineTo(x + s * 0.1, y - s * 0.05); ctx.lineTo(x, y - s * 0.11); ctx.closePath(); ctx.fill(); // scarf
  const hg = ctx.createRadialGradient(x - s * 0.07, y - s * 0.33, s * 0.05, x, y - s * 0.26, s * 0.23);
  hg.addColorStop(0, '#f8d7ae'); hg.addColorStop(1, '#e0aa72');
  ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(x, y - s * 0.26, s * 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5a3220'; // hair sides
  ctx.beginPath(); ctx.arc(x - s * 0.19, y - s * 0.2, s * 0.06, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + s * 0.19, y - s * 0.2, s * 0.06, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = grad(ctx, x, y - s * 0.62, s, s * 0.3, '#ffffff', '#d5dbdb'); // chef hat
  ctx.beginPath(); ctx.arc(x - s * 0.1, y - s * 0.44, s * 0.11, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + s * 0.1, y - s * 0.44, s * 0.11, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y - s * 0.5, s * 0.12, 0, Math.PI * 2); ctx.fill();
  rr(ctx, x - s * 0.17, y - s * 0.42, s * 0.34, s * 0.09, s * 0.03); ctx.fill();
  ctx.fillStyle = '#2c2118';
  for (const dx of [-0.07, 0.07]) { ctx.beginPath(); ctx.arc(x + dx * s, y - s * 0.27, s * 0.024, 0, Math.PI * 2); ctx.fill(); }
  ctx.strokeStyle = '#2c2118'; ctx.lineWidth = s * 0.028; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y - s * 0.19, s * 0.06, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
  ctx.restore();
}

/** The sleeping cat mascot, breathing gently (scale pulses with t). */
export function catPainter(ctx, x, y, s, t) {
  ctx.save();
  const breathe = 1 + Math.sin(t * 1.6) * 0.03;
  ctx.translate(x, y); ctx.scale(1, breathe);
  ctx.fillStyle = grad(ctx, 0, -s * 0.3, s, s * 0.5, '#f0a35e', '#c97a2e');
  ell(ctx, 0, 0, s * 0.42, s * 0.2); ctx.fill(); // curled body
  ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.08, s * 0.17, 0, Math.PI * 2); ctx.fill(); // head
  for (const dx of [-0.4, -0.22]) { // ears
    ctx.beginPath(); ctx.moveTo(dx * s, -s * 0.2); ctx.lineTo((dx + 0.07) * s, -s * 0.34); ctx.lineTo((dx + 0.13) * s, -s * 0.18); ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = '#c97a2e'; ctx.lineWidth = s * 0.09; ctx.lineCap = 'round'; // tail curl
  ctx.beginPath(); ctx.arc(s * 0.18, -s * 0.02, s * 0.24, -0.4, 1.5); ctx.stroke();
  ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = s * 0.03; // closed eyes
  ctx.beginPath(); ctx.arc(-s * 0.33, -s * 0.08, s * 0.045, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
  ctx.beginPath(); ctx.arc(-s * 0.22, -s * 0.08, s * 0.045, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
  ctx.fillStyle = 'rgba(90,50,10,0.3)'; // stripes
  for (const dx of [-0.05, 0.08, 0.2]) { ell(ctx, dx * s, -s * 0.14, s * 0.03, s * 0.07); ctx.fill(); }
  ctx.restore();
  ctx.fillStyle = 'rgba(230,220,255,0.8)';
  ctx.font = `bold ${Math.round(s * 0.24)}px Georgia, serif`;
  const float = Math.sin(t * 1.1) * 2;
  ctx.fillText('z', x - s * 0.52, y - s * 0.3 + float);
  ctx.font = `bold ${Math.round(s * 0.34)}px Georgia, serif`;
  ctx.fillText('z', x - s * 0.66, y - s * 0.5 + float);
}

// ------------------------------------------------------------------ appliances
// One consistent style: warm steel/copper bodies, light top-left, shadow right,
// small glints, and a detailed working face per station (see the polish notes).
function applianceBody(ctx, x, y, w, h, c1, c2) {
  ctx.fillStyle = grad(ctx, x, y, w, h, c1, c2);
  rr(ctx, x, y, w, h, 8); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  rr(ctx, x + 3, y + 3, w * 0.4, h - 6, 6); ctx.fill();
  ctx.strokeStyle = 'rgba(40,20,5,0.35)'; ctx.lineWidth = 2; rr(ctx, x, y, w, h, 8); ctx.stroke();
}
function knobs(ctx, x, y, n, s) {
  for (let i = 0; i < n; i++) {
    const kx = x + i * s;
    ctx.fillStyle = '#2e2a26'; ctx.beginPath(); ctx.arc(kx, y, s * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d8cfc0'; ctx.beginPath(); ctx.arc(kx - s * 0.08, y - s * 0.08, s * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f3e6c8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(kx, y); ctx.lineTo(kx + Math.cos(i * 1.7) * s * 0.22, y + Math.sin(i * 1.7) * s * 0.22); ctx.stroke();
  }
}

export const APPLIANCES = {
  prep(ctx, x, y, w, h, active, t) {
    // wooden chopping block with grain, a resting knife, chopped bits when busy
    ctx.fillStyle = grad(ctx, x, y, w, h, '#d9a45f', '#9c6b2f');
    rr(ctx, x, y + h * 0.3, w, h * 0.62, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(90,50,10,0.4)'; ctx.lineWidth = 1.6;
    for (const f of [0.48, 0.66, 0.82]) { ctx.beginPath(); ctx.moveTo(x + 6, y + h * f); ctx.bezierCurveTo(x + w * 0.3, y + h * f - 3, x + w * 0.6, y + h * f + 3, x + w - 6, y + h * f); ctx.stroke(); }
    ctx.fillStyle = grad(ctx, x, y, w, h * 0.4, '#eec27f', '#c98d4b');
    rr(ctx, x + w * 0.06, y + h * 0.08, w * 0.88, h * 0.3, 6); ctx.fill(); // board top
    // knife resting on the board: blade with glint + dark handle
    ctx.save(); ctx.translate(x + w * 0.52, y + h * 0.24); ctx.rotate(-0.16);
    ctx.fillStyle = '#e8edf0'; ctx.beginPath(); ctx.moveTo(-w * 0.2, 0); ctx.lineTo(w * 0.12, -h * 0.02); ctx.quadraticCurveTo(w * 0.2, h * 0.03, w * 0.1, h * 0.07); ctx.lineTo(-w * 0.18, h * 0.05); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(-w * 0.16, h * 0.005, w * 0.2, 2);
    ctx.fillStyle = '#4a2f18'; rr(ctx, w * 0.1, -h * 0.015, w * 0.2, h * 0.075, 4); ctx.fill();
    ctx.restore();
    if (active) { // chopped bits scatter
      ctx.fillStyle = '#7cb35a';
      for (let i = 0; i < 5; i++) { const bx = x + w * (0.2 + 0.13 * i); const by = y + h * (0.2 + (i % 2) * 0.08) + Math.sin(t * 9 + i) * 1.5; ell(ctx, bx, by, 4, 2.6); ctx.fill(); }
    }
    glint(ctx, x + w * 0.12, y + h * 0.14, 26);
  },
  grill(ctx, x, y, w, h, active, t) {
    applianceBody(ctx, x, y, w, h, '#6d6a66', '#3d3a37');
    // grill plate with grate marks
    ctx.fillStyle = '#262422'; rr(ctx, x + w * 0.07, y + h * 0.1, w * 0.86, h * 0.52, 5); ctx.fill();
    ctx.strokeStyle = '#4d4a46'; ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) { const gy = y + h * (0.16 + i * 0.11); ctx.beginPath(); ctx.moveTo(x + w * 0.1, gy); ctx.lineTo(x + w * 0.9, gy); ctx.stroke(); }
    if (active) { // ember glow under the grates + sheen sweep
      const flicker = 0.55 + Math.sin(t * 11) * 0.15;
      ctx.fillStyle = `rgba(255,110,30,${flicker})`;
      rr(ctx, x + w * 0.12, y + h * 0.5, w * 0.76, h * 0.08, 4); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      ctx.beginPath(); ctx.moveTo(x + w * 0.1, y + h * 0.62); ctx.lineTo(x + w * 0.45, y + h * 0.1); ctx.lineTo(x + w * 0.62, y + h * 0.1); ctx.lineTo(x + w * 0.27, y + h * 0.62); ctx.closePath(); ctx.fill();
    }
    knobs(ctx, x + w * 0.2, y + h * 0.8, 3, w * 0.3);
  },
  fryer(ctx, x, y, w, h, active, t) {
    applianceBody(ctx, x, y, w, h, '#9fb2ba', '#5f747e');
    // oil vat
    ctx.fillStyle = '#31424c'; rr(ctx, x + w * 0.08, y + h * 0.12, w * 0.84, h * 0.44, 5); ctx.fill();
    ctx.fillStyle = '#e8a83e'; rr(ctx, x + w * 0.11, y + h * 0.16, w * 0.78, h * 0.36, 4); ctx.fill();
    if (active) { // bubbling oil
      ctx.fillStyle = 'rgba(255,230,160,0.85)';
      for (let i = 0; i < 7; i++) {
        const bx = x + w * (0.18 + (i * 0.11) % 0.7); const by = y + h * (0.24 + ((i * 37) % 10) / 40) + Math.sin(t * 8 + i * 1.7) * 2;
        ctx.beginPath(); ctx.arc(bx, by, 2.4 + (i % 3), 0, Math.PI * 2); ctx.fill();
      }
    }
    // wire basket, raised, with handle
    ctx.strokeStyle = '#dfe7ea'; ctx.lineWidth = 2;
    rr(ctx, x + w * 0.2, y + h * 0.02, w * 0.6, h * 0.2, 3); ctx.stroke();
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x + w * (0.2 + i * 0.15), y + h * 0.03); ctx.lineTo(x + w * (0.2 + i * 0.15), y + h * 0.21); ctx.stroke(); }
    ctx.strokeStyle = '#37474f'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x + w * 0.5, y + h * 0.02); ctx.lineTo(x + w * 0.5, y - h * 0.06); ctx.stroke();
    knobs(ctx, x + w * 0.28, y + h * 0.78, 2, w * 0.42);
    glint(ctx, x + w * 0.14, y + h * 0.66, 30);
  },
  stove(ctx, x, y, w, h, active, t) {
    applianceBody(ctx, x, y, w, h, '#8d99a3', '#4d5a63');
    // two burners with concentric rings and cast-iron grates
    for (const f of [0.28, 0.72]) {
      const bx = x + w * f; const by = y + h * 0.3;
      ctx.fillStyle = '#22252a'; ctx.beginPath(); ctx.arc(bx, by, w * 0.17, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#3c4148'; ctx.lineWidth = 3;
      for (const r of [0.12, 0.075]) { ctx.beginPath(); ctx.arc(bx, by, w * r, 0, Math.PI * 2); ctx.stroke(); }
      ctx.strokeStyle = '#15171b'; ctx.lineWidth = 4; // grate cross
      ctx.beginPath(); ctx.moveTo(bx - w * 0.17, by); ctx.lineTo(bx + w * 0.17, by); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bx, by - h * 0.17); ctx.lineTo(bx, by + h * 0.17); ctx.stroke();
      if (active) { // blue flame ring, flickering
        ctx.strokeStyle = `rgba(90,170,255,${0.65 + Math.sin(t * 13 + f * 9) * 0.2})`; ctx.lineWidth = 3.4;
        ctx.beginPath(); ctx.arc(bx, by, w * 0.1, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(255,160,60,0.5)'; ctx.beginPath(); ctx.arc(bx, by, w * 0.045, 0, Math.PI * 2); ctx.fill();
      }
    }
    knobs(ctx, x + w * 0.16, y + h * 0.78, 4, w * 0.22);
    glint(ctx, x + w * 0.1, y + h * 0.58, 30);
  },
  oven(ctx, x, y, w, h, active, t) {
    // brick body: courses of bricks with mortar lines
    ctx.fillStyle = grad(ctx, x, y, w, h, '#b06a45', '#7c4526');
    rr(ctx, x, y, w, h, 9); ctx.fill();
    ctx.strokeStyle = 'rgba(70,35,15,0.45)'; ctx.lineWidth = 1.6;
    for (let row = 1; row < 5; row++) { ctx.beginPath(); ctx.moveTo(x + 4, y + row * h * 0.2); ctx.lineTo(x + w - 4, y + row * h * 0.2); ctx.stroke(); }
    for (let row = 0; row < 5; row++) for (let colI = 0; colI < 3; colI++) {
      const vx = x + w * (0.25 + colI * 0.25) + (row % 2) * w * 0.1;
      ctx.beginPath(); ctx.moveTo(vx, y + row * h * 0.2 + 2); ctx.lineTo(vx, y + (row + 1) * h * 0.2 - 2); ctx.stroke();
    }
    // chimney
    ctx.fillStyle = grad(ctx, x, y - h * 0.34, w * 0.3, h * 0.36, '#c07a50', '#8a4f2c');
    rr(ctx, x + w * 0.35, y - h * 0.32, w * 0.3, h * 0.34, 4); ctx.fill();
    ctx.fillStyle = '#5d3520'; rr(ctx, x + w * 0.31, y - h * 0.38, w * 0.38, h * 0.08, 3); ctx.fill();
    // arched door with fire glowing inside
    ctx.fillStyle = '#2a1608';
    ctx.beginPath(); ctx.moveTo(x + w * 0.22, y + h * 0.92); ctx.lineTo(x + w * 0.22, y + h * 0.45);
    ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.08, x + w * 0.78, y + h * 0.45); ctx.lineTo(x + w * 0.78, y + h * 0.92); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#e8c48a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x + w * 0.22, y + h * 0.92); ctx.lineTo(x + w * 0.22, y + h * 0.45);
    ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.08, x + w * 0.78, y + h * 0.45); ctx.lineTo(x + w * 0.78, y + h * 0.92); ctx.stroke();
    if (active) { // flames
      for (const [fx, fs, ph] of [[0.4, 0.2, 0], [0.52, 0.3, 2.1], [0.63, 0.18, 4.2]]) {
        const fh = h * fs * (1 + Math.sin(t * 9 + ph) * 0.18);
        const fg = ctx.createLinearGradient(0, y + h * 0.9, 0, y + h * 0.9 - fh);
        fg.addColorStop(0, '#e67e22'); fg.addColorStop(0.6, '#f39c12'); fg.addColorStop(1, '#f7dc6f');
        ctx.fillStyle = fg;
        ctx.beginPath(); ctx.moveTo(x + w * (fx - 0.07), y + h * 0.9);
        ctx.quadraticCurveTo(x + w * fx, y + h * 0.9 - fh, x + w * (fx + 0.07), y + h * 0.9); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,170,60,0.2)'; ell(ctx, x + w * 0.5, y + h * 0.62, w * 0.3, h * 0.3); ctx.fill();
    }
    ctx.fillStyle = '#3a2410'; ell(ctx, x + w * 0.5, y + h * 0.94, w * 0.34, h * 0.045); ctx.fill(); // stone ledge shadow line
  },
  drinks(ctx, x, y, w, h, active, t) {
    applianceBody(ctx, x, y, w, h, '#7d5ba6', '#4a3468');
    // tap bank: three taps with drink-coloured labels
    const cols = ['#6f4e37', '#e67e22', '#a93226'];
    for (let i = 0; i < 3; i++) {
      const tx = x + w * (0.22 + i * 0.28);
      ctx.fillStyle = cols[i]; rr(ctx, tx - w * 0.09, y + h * 0.1, w * 0.18, h * 0.14, 3); ctx.fill();
      ctx.fillStyle = '#cfd8dc'; rr(ctx, tx - w * 0.035, y + h * 0.24, w * 0.07, h * 0.12, 2); ctx.fill();
      ctx.fillStyle = '#26303a'; ctx.beginPath(); ctx.arc(tx, y + h * 0.38, w * 0.028, 0, Math.PI * 2); ctx.fill();
    }
    // buttons row
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db'][i];
      ctx.beginPath(); ctx.arc(x + w * (0.2 + i * 0.2), y + h * 0.52, w * 0.045, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(x + w * (0.2 + i * 0.2) - 1.5, y + h * 0.52 - 1.5, w * 0.016, 0, Math.PI * 2); ctx.fill();
    }
    // a cup waiting under the middle tap + drip tray
    ctx.fillStyle = '#f7f9fa'; ctx.beginPath(); ctx.moveTo(x + w * 0.42, y + h * 0.62); ctx.lineTo(x + w * 0.58, y + h * 0.62); ctx.lineTo(x + w * 0.55, y + h * 0.82); ctx.lineTo(x + w * 0.45, y + h * 0.82); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6f4e37'; ctx.fillRect(x + w * 0.435, y + h * 0.65, w * 0.13, h * 0.05);
    if (active) { ctx.strokeStyle = '#a06a35'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x + w * 0.5, y + h * 0.4); ctx.lineTo(x + w * 0.5, y + h * 0.62 + Math.sin(t * 6) * 1); ctx.stroke(); }
    ctx.fillStyle = '#33254a'; rr(ctx, x + w * 0.12, y + h * 0.86, w * 0.76, h * 0.07, 3); ctx.fill();
    glint(ctx, x + w * 0.1, y + h * 0.3, 28);
  },
};

// ------------------------------------------------------------------ shop icons
export function iconPainter(ctx, name, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineCap = 'round';
  if (name === 'knife') {
    ctx.rotate(-0.5);
    ctx.fillStyle = '#e8edf0'; ctx.beginPath(); ctx.moveTo(-s * 0.4, 0); ctx.lineTo(s * 0.14, -s * 0.06); ctx.quadraticCurveTo(s * 0.24, 0, s * 0.12, s * 0.08); ctx.lineTo(-s * 0.36, s * 0.06); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4a2f18'; rr(ctx, s * 0.12, -s * 0.05, s * 0.3, s * 0.11, s * 0.04); ctx.fill();
  } else if (name === 'flame') {
    const g = ctx.createLinearGradient(0, s * 0.4, 0, -s * 0.45);
    g.addColorStop(0, '#e67e22'); g.addColorStop(0.6, '#f39c12'); g.addColorStop(1, '#f7dc6f');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, -s * 0.45); ctx.quadraticCurveTo(s * 0.32, -s * 0.05, s * 0.26, s * 0.18);
    ctx.quadraticCurveTo(s * 0.2, s * 0.42, 0, s * 0.42); ctx.quadraticCurveTo(-s * 0.2, s * 0.42, -s * 0.26, s * 0.18);
    ctx.quadraticCurveTo(-s * 0.3, -s * 0.02, 0, -s * 0.45); ctx.fill();
  } else if (name === 'fries') {
    SHAPES.fries(ctx, 0, 0, s * 1.15, '#f2c14e');
  } else if (name === 'pot') {
    ctx.fillStyle = grad(ctx, -s * 0.4, -s * 0.2, s * 0.8, s * 0.55, '#b0bec5', '#607d8b');
    rr(ctx, -s * 0.36, -s * 0.12, s * 0.72, s * 0.5, s * 0.08); ctx.fill();
    ctx.fillStyle = '#78909c'; ell(ctx, 0, -s * 0.12, s * 0.38, s * 0.09); ctx.fill();
    ctx.fillStyle = '#f5deb3'; ell(ctx, 0, -s * 0.13, s * 0.3, s * 0.06); ctx.fill();
    ctx.fillStyle = '#37474f'; rr(ctx, -s * 0.14, -s * 0.34, s * 0.28, s * 0.07, s * 0.03); ctx.fill();
  } else if (name === 'oven') {
    APPLIANCES.oven(ctx, -s * 0.4, -s * 0.35, s * 0.8, s * 0.72, true, 1.3);
  } else if (name === 'pantry') {
    ctx.fillStyle = grad(ctx, -s * 0.35, -s * 0.35, s * 0.7, s * 0.7, '#a9713a', '#6f451c');
    rr(ctx, -s * 0.35, -s * 0.35, s * 0.7, s * 0.7, s * 0.06); ctx.fill();
    ctx.strokeStyle = '#e8c48a'; ctx.lineWidth = s * 0.04;
    ctx.strokeRect(-s * 0.24, -s * 0.24, s * 0.48, s * 0.48);
    ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.arc(s * 0.14, 0, s * 0.045, 0, Math.PI * 2); ctx.fill();
  } else if (name === 'tray') {
    ctx.fillStyle = grad(ctx, -s * 0.42, -s * 0.2, s * 0.84, s * 0.4, '#cfd8dc', '#78909c');
    ell(ctx, 0, s * 0.05, s * 0.42, s * 0.16); ctx.fill();
    ell(ctx, 0, s * 0.02, s * 0.32, s * 0.11); ctx.fillStyle = '#90a4ae'; ctx.fill();
    ingredientPainter(ctx, 'tomato', -s * 0.14, -s * 0.05, s * 0.4);
    ingredientPainter(ctx, 'cheese', s * 0.15, -s * 0.04, s * 0.38);
  } else if (name === 'helper') {
    characterPainter(ctx, { id: 'helper', color: '#2e86ab', hair: '#26303a' }, 0, -s * 0.05, s * 1.05, 'happy', 1);
  } else if (name === 'plant') {
    ctx.fillStyle = '#b3543f'; ctx.beginPath(); ctx.moveTo(-s * 0.2, s * 0.05); ctx.lineTo(s * 0.2, s * 0.05); ctx.lineTo(s * 0.14, s * 0.36); ctx.lineTo(-s * 0.14, s * 0.36); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#3f7d33'; ctx.lineWidth = s * 0.05;
    for (const a of [-0.6, -0.2, 0.25, 0.6]) { ctx.beginPath(); ctx.moveTo(0, s * 0.05); ctx.quadraticCurveTo(Math.sin(a) * s * 0.2, -s * 0.15, Math.sin(a) * s * 0.34, -s * 0.3 - Math.abs(a) * -s * 0.1); ctx.stroke(); }
    ctx.fillStyle = '#57a047';
    for (const a of [-0.6, -0.2, 0.25, 0.6]) { ell(ctx, Math.sin(a) * s * 0.34, -s * 0.3 + Math.abs(a) * s * 0.08, s * 0.09, s * 0.05); ctx.fill(); }
  } else if (name === 'painting') {
    ctx.fillStyle = '#8a5a24'; rr(ctx, -s * 0.38, -s * 0.3, s * 0.76, s * 0.6, s * 0.04); ctx.fill();
    ctx.fillStyle = '#f7e3b0'; rr(ctx, -s * 0.3, -s * 0.22, s * 0.6, s * 0.44, s * 0.02); ctx.fill();
    ctx.fillStyle = '#e67e22'; ctx.beginPath(); ctx.arc(-s * 0.1, -s * 0.02, s * 0.09, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7cb35a'; ctx.beginPath(); ctx.moveTo(-s * 0.3, s * 0.22); ctx.lineTo(-s * 0.05, -s * 0.06); ctx.lineTo(s * 0.12, s * 0.22); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5d8a48'; ctx.beginPath(); ctx.moveTo(s * 0.02, s * 0.22); ctx.lineTo(s * 0.2, s * 0.02); ctx.lineTo(s * 0.3, s * 0.22); ctx.closePath(); ctx.fill();
  } else if (name === 'lamp') {
    ctx.strokeStyle = '#5a4632'; ctx.lineWidth = s * 0.045;
    ctx.beginPath(); ctx.moveTo(0, -s * 0.42); ctx.lineTo(0, -s * 0.12); ctx.stroke();
    const g = ctx.createLinearGradient(0, -s * 0.14, 0, s * 0.2);
    g.addColorStop(0, '#f7dc6f'); g.addColorStop(1, '#d68910');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-s * 0.26, s * 0.16); ctx.lineTo(-s * 0.12, -s * 0.14); ctx.lineTo(s * 0.12, -s * 0.14); ctx.lineTo(s * 0.26, s * 0.16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff6c9'; ell(ctx, 0, s * 0.2, s * 0.14, s * 0.05); ctx.fill();
  } else if (name === 'stool') {
    ctx.fillStyle = grad(ctx, -s * 0.3, -s * 0.2, s * 0.6, s * 0.2, '#c0392b', '#7b241c');
    ell(ctx, 0, -s * 0.12, s * 0.32, s * 0.11); ctx.fill();
    ctx.strokeStyle = '#6e4a1f'; ctx.lineWidth = s * 0.06;
    for (const dx of [-0.2, 0.2]) { ctx.beginPath(); ctx.moveTo(dx * s, -s * 0.06); ctx.lineTo(dx * s * 1.15, s * 0.38); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-s * 0.24, s * 0.18); ctx.lineTo(s * 0.24, s * 0.18); ctx.stroke();
  } else if (name === 'coin') {
    const g = ctx.createRadialGradient(-s * 0.08, -s * 0.08, s * 0.05, 0, 0, s * 0.36);
    g.addColorStop(0, '#f9e79f'); g.addColorStop(1, '#d4ac0d');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s * 0.34, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#9a7d0a'; ctx.lineWidth = s * 0.045; ctx.beginPath(); ctx.arc(0, 0, s * 0.26, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#9a7d0a'; ctx.font = `bold ${Math.round(s * 0.4)}px Georgia, serif`; ctx.textAlign = 'center'; ctx.fillText('$', 0, s * 0.14);
  } else if (name === 'heart') {
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath(); ctx.moveTo(0, s * 0.34); ctx.bezierCurveTo(-s * 0.5, -s * 0.02, -s * 0.3, -s * 0.4, 0, -s * 0.16);
    ctx.bezierCurveTo(s * 0.3, -s * 0.4, s * 0.5, -s * 0.02, 0, s * 0.34); ctx.fill();
    glint(ctx, -s * 0.14, -s * 0.14, s * 0.7);
  } else if (name === 'star') {
    ctx.fillStyle = '#f4c542';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const r = i % 2 ? s * 0.18 : s * 0.38; const px = Math.cos(a) * r; const py = Math.sin(a) * r; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#b8860b'; ctx.lineWidth = s * 0.04; ctx.stroke();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ title logo
/** The designed logo: layered display lettering with a copper-to-gold gradient,
 *  a copper pan and ladle in the composition, and a ribbon beneath. */
export function logoPainter(ctx, cx, cy, w, t) {
  ctx.save();
  ctx.translate(cx, cy);
  const scale = w / 640;
  ctx.scale(scale, scale);
  // copper pan behind the lettering, left
  ctx.save(); ctx.translate(-268, 6); ctx.rotate(-0.16 + Math.sin(t * 0.8) * 0.02);
  const pg = ctx.createRadialGradient(-8, -8, 6, 0, 0, 52);
  pg.addColorStop(0, '#e8a06a'); pg.addColorStop(0.7, '#b25a2e'); pg.addColorStop(1, '#7c3a16');
  ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8a4520'; ctx.beginPath(); ctx.arc(0, 0, 38, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d97f3e'; ctx.beginPath(); ctx.arc(-6, -6, 32, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7c3a16'; rr(ctx, 40, -7, 62, 13, 6); ctx.fill();
  ctx.fillStyle = 'rgba(255,220,170,0.8)'; ell(ctx, -18, -20, 14, 6); ctx.fill();
  ctx.restore();
  // ladle, right, tilted
  ctx.save(); ctx.translate(272, -2); ctx.rotate(0.5);
  ctx.fillStyle = '#c97a3a'; rr(ctx, -5, -64, 10, 74, 5); ctx.fill();
  const lg = ctx.createRadialGradient(-4, 16, 3, 0, 20, 30);
  lg.addColorStop(0, '#e8a06a'); lg.addColorStop(1, '#8a4520');
  ctx.fillStyle = lg; ell(ctx, 0, 22, 27, 20); ctx.fill();
  ctx.fillStyle = '#a55a28'; ell(ctx, 0, 20, 19, 13); ctx.fill();
  ctx.restore();
  // lettering: dark outline pass, then gradient fill pass
  ctx.textAlign = 'center';
  ctx.font = '900 74px "Trebuchet MS", Verdana, sans-serif';
  ctx.shadowColor = 'rgba(20,5,0,0.55)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 6;
  ctx.lineWidth = 13; ctx.strokeStyle = '#33180a'; ctx.lineJoin = 'round';
  ctx.strokeText('THE COPPER', 0, -16);
  ctx.strokeText('LADLE', 0, 62);
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  const tg = ctx.createLinearGradient(0, -80, 0, 70);
  tg.addColorStop(0, '#f9e79f'); tg.addColorStop(0.35, '#f0a35e'); tg.addColorStop(0.62, '#c96a2e'); tg.addColorStop(1, '#f4c542');
  ctx.fillStyle = tg;
  ctx.fillText('THE COPPER', 0, -16);
  ctx.fillText('LADLE', 0, 62);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '900 74px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('THE COPPER', 0, -19);
  // ribbon
  ctx.fillStyle = '#7b241c';
  ctx.beginPath(); ctx.moveTo(-170, 84); ctx.lineTo(170, 84); ctx.lineTo(196, 100); ctx.lineTo(170, 116); ctx.lineTo(-170, 116); ctx.lineTo(-196, 100); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#922b21'; rr(ctx, -168, 84, 336, 32, 4); ctx.fill();
  ctx.fillStyle = '#f9e79f'; ctx.font = 'bold 21px "Trebuchet MS", Verdana, sans-serif';
  ctx.fillText('· DINER RESCUE ·', 0, 108);
  // sparkles
  ctx.fillStyle = '#ffe9a8';
  for (const [sx, sy, ss] of [[-238, -58, 9], [228, -64, 7], [196, 30, 6], [-206, 44, 6]]) {
    const tw = 0.7 + Math.sin(t * 2.6 + sx) * 0.3;
    ctx.save(); ctx.translate(sx, sy); ctx.scale(tw, tw);
    ctx.beginPath(); ctx.moveTo(0, -ss); ctx.lineTo(ss * 0.28, -ss * 0.28); ctx.lineTo(ss, 0); ctx.lineTo(ss * 0.28, ss * 0.28); ctx.lineTo(0, ss); ctx.lineTo(-ss * 0.28, ss * 0.28); ctx.lineTo(-ss, 0); ctx.lineTo(-ss * 0.28, -ss * 0.28); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
