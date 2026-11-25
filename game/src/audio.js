// All of the diner's sound, synthesized with WebAudio — no audio files. Three distinct
// music tracks (calm for title and map, lively for service, mellow for the night shop),
// victory and game-over stingers, and a matched cue for every click and event in the
// game. The cue map at the bottom is printed on the How to Play page.

let ctx = null;
let master = null;
let noiseBuffer = null;
let muted = false;

function ensure() {
  if (ctx) return true;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return true;
  } catch {
    return false;
  }
}

export function unlockAudio() {
  if (ensure() && ctx.state === 'suspended') ctx.resume();
}
export function setMuted(value) {
  muted = value;
  if (master) master.gain.value = value ? 0 : 0.5;
}
export function isMuted() {
  return muted;
}

function tone(freq, t0, dur, { type = 'sine', vol = 0.2, slide = 0, attack = 0.005 } = {}) {
  if (!ensure()) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(t0, dur, { vol = 0.15, freq = 1200, q = 1, sweep = 0 } = {}) {
  if (!ensure()) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(freq, t0);
  if (sweep) filter.frequency.exponentialRampToValueAtTime(Math.max(60, freq + sweep), t0 + dur);
  filter.Q.value = q;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  src.connect(filter).connect(gain).connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.05);
}

const now = () => (ctx ? ctx.currentTime : 0);
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

// ------------------------------------------------------------------ music
// Each track: tempo, two bars of bass and melody as midi notes (0 = rest), waveforms.
const TRACKS = {
  calm: {
    bpm: 72, wave: 'triangle', bassWave: 'sine', vol: 0.1,
    bass: [48, 0, 55, 0, 45, 0, 52, 0, 48, 0, 55, 0, 43, 0, 50, 0],
    melody: [72, 0, 76, 79, 0, 76, 0, 74, 72, 0, 69, 0, 71, 0, 0, 0],
  },
  lively: {
    bpm: 116, wave: 'square', bassWave: 'triangle', vol: 0.055,
    bass: [45, 45, 0, 45, 52, 0, 45, 0, 43, 43, 0, 43, 50, 0, 52, 0],
    melody: [69, 72, 76, 72, 74, 76, 79, 76, 74, 72, 74, 69, 67, 69, 0, 0],
  },
  mellow: {
    bpm: 84, wave: 'sine', bassWave: 'sine', vol: 0.11,
    bass: [41, 0, 0, 48, 0, 0, 45, 0, 0, 52, 0, 0, 43, 0, 50, 0],
    melody: [65, 0, 69, 0, 72, 0, 69, 65, 64, 0, 67, 0, 69, 0, 0, 0],
  },
};
let musicTimer = null;
let musicTrack = null;
let musicStep = 0;
let nextNoteAt = 0;

export function startMusic(name) {
  if (!ensure()) return;
  if (musicTrack === name && musicTimer) return;
  stopMusic();
  musicTrack = name;
  musicStep = 0;
  nextNoteAt = ctx.currentTime + 0.06;
  const tickScheduler = () => {
    const track = TRACKS[musicTrack];
    if (!track) return;
    const stepDur = 60 / track.bpm / 2; // eighth notes
    while (nextNoteAt < ctx.currentTime + 0.18) {
      const i = musicStep % 16;
      const bass = track.bass[i];
      const mel = track.melody[i];
      if (bass) tone(midi(bass), nextNoteAt, stepDur * 1.8, { type: track.bassWave, vol: track.vol * 1.5 });
      if (mel) tone(midi(mel), nextNoteAt, stepDur * 1.6, { type: track.wave, vol: track.vol });
      nextNoteAt += stepDur;
      musicStep += 1;
    }
  };
  tickScheduler();
  musicTimer = setInterval(tickScheduler, 60);
}
export function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
  musicTrack = null;
}
export function currentMusic() {
  return musicTrack;
}

// ------------------------------------------------------------------ stingers
export function stingVictory() {
  if (!ensure()) return;
  const t = now();
  [60, 64, 67, 72, 76, 79, 84].forEach((m, i) => tone(midi(m), t + i * 0.11, 0.34, { type: 'triangle', vol: 0.16 }));
}
export function stingDefeat() {
  if (!ensure()) return;
  const t = now();
  [55, 53, 50, 46].forEach((m, i) => tone(midi(m), t + i * 0.22, 0.3, { type: 'triangle', vol: 0.13 }));
}

// ------------------------------------------------------------------ cues
export const sfx = {
  blip() { tone(660, now(), 0.07, { type: 'triangle', vol: 0.12 }); },
  pop() { tone(340, now(), 0.09, { type: 'sine', vol: 0.2, slide: 260 }); },
  thunk() { tone(140, now(), 0.1, { type: 'sine', vol: 0.22, slide: -60 }); noise(now(), 0.05, { vol: 0.06, freq: 500 }); },
  sizzle() { noise(now(), 0.28, { vol: 0.1, freq: 5200, q: 0.7 }); },
  chop() { noise(now(), 0.06, { vol: 0.2, freq: 1800, q: 2 }); tone(220, now(), 0.05, { type: 'square', vol: 0.06 }); },
  bubble() { const t = now(); tone(300, t, 0.16, { vol: 0.1, slide: 160 }); tone(360, t + 0.07, 0.14, { vol: 0.08, slide: 140 }); },
  pour() { noise(now(), 0.3, { vol: 0.09, freq: 900, sweep: 900, q: 1.4 }); },
  tap() { tone(880, now(), 0.05, { type: 'triangle', vol: 0.1 }); },
  bell() { const t = now(); tone(1568, t, 0.4, { vol: 0.1 }); tone(2093, t, 0.3, { vol: 0.05 }); },
  coin() { const t = now(); tone(988, t, 0.09, { vol: 0.12 }); tone(1319, t + 0.07, 0.16, { vol: 0.12 }); },
  perfect() { const t = now(); tone(1319, t, 0.2, { vol: 0.12 }); tone(1760, t + 0.05, 0.24, { vol: 0.1 }); },
  perfectServe() { const t = now(); [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, t + i * 0.06, 0.22, { vol: 0.1 })); },
  comboRise(level) { const t = now(); const base = 620 + level * 70; tone(base, t, 0.09, { type: 'triangle', vol: 0.12 }); tone(base * 1.25, t + 0.06, 0.12, { type: 'triangle', vol: 0.1 }); },
  comboBreak() { const t = now(); tone(520, t, 0.16, { type: 'triangle', vol: 0.11, slide: -240 }); },
  fever() { const t = now(); [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, t + i * 0.07, 0.2, { type: 'square', vol: 0.06 })); },
  crumple() { noise(now(), 0.18, { vol: 0.14, freq: 700, q: 0.8 }); },
  buy() { const t = now(); [988, 1319, 1568, 1976].forEach((f, i) => tone(f, t + i * 0.05, 0.14, { vol: 0.09 })); },
  itemGet() { const t = now(); [659, 880, 1109, 1319].forEach((f, i) => tone(f, t + i * 0.09, 0.26, { type: 'triangle', vol: 0.13 })); },
  error() { tone(160, now(), 0.18, { type: 'sawtooth', vol: 0.07 }); },
  whoosh() { noise(now(), 0.22, { vol: 0.07, freq: 500, sweep: 1400, q: 1.2 }); },
  star(n) { const t = now(); tone(1047 + n * 220, t, 0.3, { type: 'triangle', vol: 0.13 }); },
  ring() { const t = now(); tone(1245, t, 0.14, { vol: 0.1 }); tone(1245, t + 0.2, 0.2, { vol: 0.1 }); },
  walkout() { const t = now(); tone(392, t, 0.14, { vol: 0.09 }); tone(330, t + 0.12, 0.2, { vol: 0.09 }); },
  helper() { tone(740, now(), 0.06, { type: 'sine', vol: 0.05 }); },
};

/** Station-flavoured cooking clicks, by station id. */
export function cookSound(station) {
  if (station === 'grill' || station === 'fryer') sfx.sizzle();
  else if (station === 'prep') sfx.chop();
  else if (station === 'stove' || station === 'oven') sfx.bubble();
  else if (station === 'drinks') sfx.pour();
  else sfx.tap();
}

/** The cue map, printed on the How to Play page so the sound design is part of the game. */
export const CUE_MAP = [
  ['Buttons & menus', 'soft blip'],
  ['Pick an ingredient', 'pop'],
  ['Place on a station', 'thunk'],
  ['Grill & fryer clicks', 'sizzle'],
  ['Prep board clicks', 'chop chop'],
  ['Stove & oven clicks', 'bubbling'],
  ['Drinks machine', 'pouring sweep'],
  ['Plating a layer', 'tap'],
  ['Serving a dish', 'bell + coin arpeggio'],
  ['Entering the PERFECT zone', 'bright chime'],
  ['A PERFECT serve', 'sparkle arpeggio'],
  ['Combo rising', 'blip, higher each level'],
  ['Combo breaking', 'descending cue'],
  ['FEVER starting', 'fanfare'],
  ['Buying an upgrade', 'coin cascade + item-get jingle'],
  ['Trashing food', 'crumple'],
  ['A denied action', 'low buzz'],
  ['Changing screens', 'soft whoosh'],
  ['Phone order ringing', 'double ring'],
  ['Stars on the summary', 'rising chimes'],
];
