// All sound is synthesized with WebAudio: no audio files needed.
//
// Nyan Mode music: the real "Nyan Cat" song is copyrighted, so the game plays an
// original, super-fast chiptune in that spirit. If you own/licence a track you
// would rather use, drop it in /assets and set its path here, e.g. 'assets/nyan.mp3'.
export const CUSTOM_NYAN_TRACK = '';

let ctx = null, master, sfx, musicBus, noiseBuf;
let volume = 0.7;

export function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 4;
  master = ctx.createGain();
  master.gain.value = volume;
  master.connect(comp).connect(ctx.destination);
  sfx = ctx.createGain();
  sfx.connect(master);
  musicBus = ctx.createGain();
  musicBus.gain.value = 0.32;
  musicBus.connect(master);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}

export function setVolume(v) {
  volume = v;
  if (master) master.gain.value = v;
}

const now = () => ctx.currentTime;

function env(g, t0, a, peak, hold, rel) {
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + a);
  g.gain.setValueAtTime(peak, t0 + a + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + hold + rel);
}

function osc(type, freq, t0, dur, dest) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  o.connect(dest);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
  return o;
}

function noise(t0, dur, dest) {
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  s.loop = true;
  s.connect(dest);
  s.start(t0, Math.random());
  s.stop(t0 + dur + 0.05);
  return s;
}

function filter(type, freq, q = 1) {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

function lpTo(dest, freq) {
  const f = filter('lowpass', freq);
  f.connect(dest);
  return f;
}

function gain(dest, v = 1) {
  const g = ctx.createGain();
  g.gain.value = v;
  g.connect(dest);
  return g;
}

// Cat voice: sawtooth through two formant filters with a pitch contour.
function catVoice(t0, contour, dur, vol = 0.5, vib = 8, rough = 0) {
  const out = gain(sfx, 0);
  env(out, t0, 0.03, vol, dur * 0.55, dur * 0.4);
  const f1 = filter('bandpass', 1000, 3), f2 = filter('bandpass', 2400, 5), lp = filter('lowpass', 3800);
  f1.connect(lp); f2.connect(lp); lp.connect(out);
  const pre = ctx.createGain();
  pre.connect(f1); pre.connect(f2);
  const o = osc('sawtooth', contour[0][1], t0, dur, pre);
  for (const [tt, f] of contour) o.frequency.linearRampToValueAtTime(f, t0 + tt * dur);
  f1.frequency.setValueAtTime(700, t0);
  f1.frequency.linearRampToValueAtTime(1300, t0 + dur * 0.35);
  f1.frequency.linearRampToValueAtTime(800, t0 + dur);
  const lfo = osc('sine', 6 + rough * 20, t0, dur, gain(o.frequency, vib + rough * 60));
  lfo.frequency.value = 6 + rough * 22;
}

export const sound = {
  meow(pitch = 1) {
    if (!ctx) return;
    const t = now(), p = pitch * (0.95 + Math.random() * 0.1);
    catVoice(t, [[0, 430 * p], [0.25, 780 * p], [0.6, 650 * p], [1, 470 * p]], 0.55, 0.45);
  },
  // Hurt: an angry "MRRAOW!" plus a hiss.
  yowl() {
    if (!ctx) return;
    const t = now();
    catVoice(t, [[0, 330], [0.2, 720], [0.55, 610], [1, 300]], 0.45, 0.5, 25, 0.6);
    sound.hiss(0.18, t + 0.28);
  },
  hiss(vol = 0.25, t = null) {
    if (!ctx) return;
    t = t ?? now();
    const g = gain(sfx, 0);
    env(g, t, 0.02, vol, 0.15, 0.2);
    const hp = filter('highpass', 2800);
    hp.connect(g);
    noise(t, 0.4, hp);
  },
  // Kill: a short cat-fight screech + hiss + scuffle.
  catFight() {
    if (!ctx) return;
    const t = now(), p = 0.9 + Math.random() * 0.3;
    catVoice(t, [[0, 600 * p], [0.3, 1050 * p], [0.7, 820 * p], [1, 500 * p]], 0.38, 0.32, 40, 1);
    catVoice(t + 0.12, [[0, 420 * p], [0.5, 690 * p], [1, 380 * p]], 0.32, 0.25, 30, 0.8);
    sound.hiss(0.16, t + 0.3);
    for (let i = 0; i < 5; i++) {
      const tt = t + 0.05 + i * 0.07 + Math.random() * 0.03;
      const g = gain(sfx, 0);
      env(g, tt, 0.005, 0.22, 0.01, 0.05);
      const bp = filter('bandpass', 600 + Math.random() * 1200, 1.2);
      bp.connect(g);
      noise(tt, 0.08, bp);
    }
  },
  swat() {
    if (!ctx) return;
    const t = now();
    const g = gain(sfx, 0);
    env(g, t, 0.01, 0.22, 0.04, 0.08);
    const bp = filter('bandpass', 700, 2);
    bp.frequency.exponentialRampToValueAtTime(3200, t + 0.12);
    bp.connect(g);
    noise(t, 0.15, bp);
  },
  hit() {
    if (!ctx) return;
    const t = now();
    const g = gain(sfx, 0);
    env(g, t, 0.003, 0.35, 0.01, 0.1);
    const lp = filter('lowpass', 900);
    lp.connect(g);
    noise(t, 0.12, lp);
    const g2 = gain(sfx, 0);
    env(g2, t, 0.003, 0.3, 0.01, 0.1);
    const o = osc('sine', 220, t, 0.12, g2);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.12);
  },
  squeak(t = null) {
    if (!ctx) return;
    t = t ?? now();
    for (let i = 0; i < 2; i++) {
      const tt = t + i * 0.13;
      const g = gain(sfx, 0);
      env(g, tt, 0.01, 0.3, 0.06, 0.05);
      const o = osc('triangle', 1300, tt, 0.13, g);
      o.frequency.linearRampToValueAtTime(2700, tt + 0.05);
      o.frequency.linearRampToValueAtTime(1700, tt + 0.12);
    }
  },
  explode() {
    if (!ctx) return;
    const t = now();
    const g = gain(sfx, 0);
    env(g, t, 0.005, 0.55, 0.05, 0.35);
    const lp = filter('lowpass', 2400);
    lp.frequency.exponentialRampToValueAtTime(180, t + 0.4);
    lp.connect(g);
    noise(t, 0.45, lp);
    const g2 = gain(sfx, 0);
    env(g2, t, 0.005, 0.5, 0.05, 0.25);
    const o = osc('sine', 140, t, 0.3, g2);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.3);
    sound.squeak(t + 0.05);
  },
  throw() {
    if (!ctx) return;
    const t = now();
    const g = gain(sfx, 0);
    env(g, t, 0.01, 0.12, 0.02, 0.1);
    const bp = filter('bandpass', 1500, 1);
    bp.connect(g);
    noise(t, 0.15, bp);
  },
  jump() {
    if (!ctx) return;
    const t = now();
    const g = gain(sfx, 0);
    env(g, t, 0.01, 0.08, 0.02, 0.08);
    const o = osc('sine', 260, t, 0.12, g);
    o.frequency.exponentialRampToValueAtTime(520, t + 0.1);
  },
  birdWarble() {
    if (!ctx) return;
    const t = now();
    for (let i = 0; i < 3; i++) {
      const tt = t + i * 0.09;
      const g = gain(sfx, 0);
      env(g, tt, 0.01, 0.1, 0.03, 0.04);
      const o = osc('sine', 1800 + Math.random() * 1400, tt, 0.09, g);
      o.frequency.linearRampToValueAtTime(2400 + Math.random() * 1200, tt + 0.07);
    }
  },
  birdScreech() {
    if (!ctx) return;
    const t = now();
    const g = gain(sfx, 0);
    env(g, t, 0.02, 0.18, 0.15, 0.2);
    const bp = filter('bandpass', 1600, 3);
    bp.connect(g);
    const o = osc('sawtooth', 1500, t, 0.4, bp);
    o.frequency.linearRampToValueAtTime(800, t + 0.38);
  },
  ratSqueak() {
    if (!ctx) return;
    const t = now();
    for (let i = 0; i < 2; i++) {
      const tt = t + i * 0.08;
      const g = gain(sfx, 0);
      env(g, tt, 0.005, 0.1, 0.03, 0.03);
      const o = osc('sine', 3400, tt, 0.07, g);
      o.frequency.linearRampToValueAtTime(4300, tt + 0.05);
    }
  },
  bark(times = 2) {
    if (!ctx) return;
    const t = now();
    for (let i = 0; i < times; i++) {
      const tt = t + i * 0.24;
      const g = gain(sfx, 0);
      env(g, tt, 0.01, 0.5, 0.06, 0.12);
      const lp = filter('lowpass', 1000, 2);
      lp.connect(g);
      const o = osc('sawtooth', 190, tt, 0.2, lp);
      o.frequency.exponentialRampToValueAtTime(105, tt + 0.18);
      const gn = gain(sfx, 0);
      env(gn, tt, 0.005, 0.2, 0.02, 0.05);
      const bp = filter('bandpass', 900, 1);
      bp.connect(gn);
      noise(tt, 0.08, bp);
    }
  },
  growl() {
    if (!ctx) return;
    const t = now();
    const g = gain(sfx, 0);
    env(g, t, 0.1, 0.35, 0.5, 0.3);
    const lp = filter('lowpass', 420, 2);
    const am = gain(lp, 0.5);
    lp.connect(g);
    const o = osc('sawtooth', 78, t, 1.0, am);
    o.frequency.linearRampToValueAtTime(70, t + 1);
    osc('square', 23, t, 1.0, gain(am.gain, 0.5));
  },
  yelp() {
    if (!ctx) return;
    const t = now();
    for (let i = 0; i < 3; i++) {
      const tt = t + i * 0.16;
      const g = gain(sfx, 0);
      env(g, tt, 0.01, 0.3, 0.05, 0.08);
      const o = osc('sawtooth', 700, tt, 0.15, lpTo(g, 2500));
      o.frequency.linearRampToValueAtTime(1300, tt + 0.05);
      o.frequency.linearRampToValueAtTime(600, tt + 0.14);
    }
  },
  pickup() {
    if (!ctx) return;
    const t = now();
    [880, 1320, 1760].forEach((f, i) => {
      const g = gain(sfx, 0);
      env(g, t + i * 0.06, 0.005, 0.15, 0.04, 0.1);
      osc('sine', f, t + i * 0.06, 0.15, g);
    });
  },
  eat() {
    if (!ctx) return;
    const t = now();
    for (let i = 0; i < 3; i++) {
      const tt = t + i * 0.17;
      const g = gain(sfx, 0);
      env(g, tt, 0.01, 0.25, 0.04, 0.07);
      const lp = filter('lowpass', 700);
      lp.connect(g);
      noise(tt, 0.12, lp);
      const g2 = gain(sfx, 0);
      env(g2, tt, 0.01, 0.12, 0.04, 0.06);
      osc('sine', 240 - i * 20, tt, 0.12, g2);
    }
  },
  purr(dur = 3) {
    if (!ctx) return;
    const t = now();
    const g = gain(sfx, 0);
    env(g, t, 0.4, 0.3, dur - 0.8, 0.4);
    const lp = filter('lowpass', 260, 1);
    const am = gain(g, 0.5);
    lp.connect(am);
    noise(t, dur, lp);
    osc('sine', 24, t, dur, gain(am.gain, 0.5));
  },
  alert() {
    if (!ctx) return;
    const t = now();
    [660, 990].forEach((f, i) => {
      const g = gain(sfx, 0);
      env(g, t + i * 0.09, 0.005, 0.2, 0.05, 0.08);
      osc('square', f, t + i * 0.09, 0.15, lpTo(g, 2500));
    });
  },
  sparkle() {
    if (!ctx) return;
    const t = now();
    [1047, 1319, 1568, 2093, 2637].forEach((f, i) => {
      const g = gain(sfx, 0);
      env(g, t + i * 0.05, 0.005, 0.12, 0.03, 0.15);
      osc('triangle', f, t + i * 0.05, 0.2, g);
    });
  },
  win() {
    if (!ctx) return;
    const t = now();
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => {
      const g = gain(sfx, 0);
      env(g, t + i * 0.12, 0.01, 0.18, 0.06, 0.15);
      osc('square', f, t + i * 0.12, 0.25, lpTo(g, 3000));
    });
  },
  lose() {
    if (!ctx) return;
    const t = now();
    [523, 466, 415, 349].forEach((f, i) => {
      const g = gain(sfx, 0);
      env(g, t + i * 0.22, 0.01, 0.18, 0.12, 0.2);
      osc('triangle', f, t + i * 0.22, 0.4, g);
    });
  },
};

// ---------------------------------------------------------------- NYAN MUSIC
// Original fast chiptune loop (I-vi-IV-V in E major at ~200 BPM).
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const CHORDS = [[64, 68, 71], [61, 64, 68], [57, 61, 64], [59, 63, 66]]; // E, C#m, A, B
const LEAD_SHAPE = [2, 1, 0, 1, 2, 4, 3, 2, 0, 2, 4, 5, 4, 2, 1, 0];
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16]; // major pentatonic-ish offsets

let musicTimer = null, nextNoteTime = 0, step = 0, customAudio = null;

export function startNyanMusic() {
  if (!ctx || musicTimer || customAudio) return;
  if (CUSTOM_NYAN_TRACK) {
    customAudio = new Audio(CUSTOM_NYAN_TRACK);
    customAudio.loop = true;
    customAudio.volume = Math.min(1, volume);
    customAudio.play().catch(() => { customAudio = null; });
    return;
  }
  step = 0;
  nextNoteTime = now() + 0.05;
  const spb = 60 / 200 / 4; // sixteenth notes at 200 BPM
  musicTimer = setInterval(() => {
    while (nextNoteTime < now() + 0.12) {
      scheduleStep(step, nextNoteTime, spb);
      nextNoteTime += spb;
      step++;
    }
  }, 25);
}

export function stopNyanMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
  if (customAudio) { customAudio.pause(); customAudio = null; }
}

function scheduleStep(s, t, spb) {
  const bar = Math.floor(s / 16) % 4;
  const i = s % 16;
  const chord = CHORDS[bar];
  const root = chord[0];
  // lead: square wave, two-bar variation
  const shape = LEAD_SHAPE[(i + (Math.floor(s / 32) % 2) * 4) % 16];
  const leadNote = root + 12 + SCALE[shape % SCALE.length];
  if (i % 8 !== 7) {
    const g = gain(musicBus, 0);
    env(g, t, 0.004, 0.22, spb * 0.5, spb * 0.4);
    osc('square', midi(leadNote), t, spb, g);
  }
  // bass: octave bounce on eighths
  if (i % 2 === 0) {
    const g = gain(musicBus, 0);
    env(g, t, 0.004, 0.3, spb * 0.8, spb * 0.5);
    osc('triangle', midi(root - 24 + (i % 4 === 2 ? 12 : 0)), t, spb * 1.5, g);
  }
  // arpeggio sparkle
  if (i % 4 === 1) {
    const g = gain(musicBus, 0);
    env(g, t, 0.003, 0.08, 0.02, spb);
    osc('square', midi(chord[(i >> 2) % 3] + 24), t, spb, g);
  }
  // drums
  if (i % 4 === 0) {
    const g = gain(musicBus, 0);
    env(g, t, 0.002, 0.6, 0.02, 0.1);
    const o = osc('sine', 150, t, 0.12, g);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.1);
  }
  if (i % 4 === 2 || i % 8 === 7) {
    const g = gain(musicBus, 0);
    env(g, t, 0.002, i % 8 === 4 ? 0.3 : 0.12, 0.01, 0.04);
    const hp = filter('highpass', 7000);
    hp.connect(g);
    noise(t, 0.06, hp);
  }
  if (i === 4 || i === 12) {
    const g = gain(musicBus, 0);
    env(g, t, 0.002, 0.3, 0.02, 0.12);
    const bp = filter('bandpass', 1800, 0.8);
    bp.connect(g);
    noise(t, 0.15, bp);
  }
}
