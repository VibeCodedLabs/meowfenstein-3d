// Procedural canvas textures: no image assets needed.
import * as THREE from 'three';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

function toTexture(c, repeat = true) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function shade(hex, amt) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, amt);
  return '#' + c.getHexString();
}

function noise(ctx, w, h, alpha = 0.05, count = 2000) {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = Math.random() < 0.5 ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
}

// One texture tile == 1 world metre.
export function woodFloor(base = '#a8703f') {
  const [c, ctx] = canvas(256, 256);
  const plankH = 256 / 5;
  for (let i = 0; i < 5; i++) {
    let x = -Math.random() * 200;
    while (x < 256) {
      const len = 120 + Math.random() * 140;
      ctx.fillStyle = shade(base, (Math.random() - 0.5) * 0.12);
      ctx.fillRect(x, i * plankH, len, plankH);
      ctx.strokeStyle = 'rgba(40,20,5,0.12)';
      for (let g = 0; g < 4; g++) {
        ctx.beginPath();
        const gy = i * plankH + 6 + Math.random() * (plankH - 12);
        ctx.moveTo(x, gy);
        ctx.bezierCurveTo(x + len / 3, gy + 3, x + (2 * len) / 3, gy - 3, x + len, gy);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(30,15,5,0.55)';
      ctx.fillRect(x, i * plankH, 2, plankH);
      x += len;
    }
    ctx.fillStyle = 'rgba(30,15,5,0.5)';
    ctx.fillRect(0, i * plankH, 256, 2);
  }
  noise(ctx, 256, 256, 0.04);
  return toTexture(c);
}

export function tileFloor(a = '#e9e4da', b = '#cfc6b8', tiles = 2) {
  const [c, ctx] = canvas(256, 256);
  const s = 256 / tiles;
  for (let y = 0; y < tiles; y++)
    for (let x = 0; x < tiles; x++) {
      ctx.fillStyle = (x + y) % 2 ? a : b;
      ctx.fillRect(x * s, y * s, s, s);
    }
  ctx.strokeStyle = 'rgba(80,70,60,0.5)';
  ctx.lineWidth = 3;
  for (let i = 0; i <= tiles; i++) {
    ctx.beginPath(); ctx.moveTo(i * s, 0); ctx.lineTo(i * s, 256); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * s); ctx.lineTo(256, i * s); ctx.stroke();
  }
  noise(ctx, 256, 256, 0.03);
  return toTexture(c);
}

export function carpet(base = '#7d8fb3') {
  const [c, ctx] = canvas(128, 128);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 128, 128);
  noise(ctx, 128, 128, 0.07, 3000);
  return toTexture(c);
}

// Wallpaper tile: 1m wide x 2.6m tall, with a skirting board baked in.
export function wallpaper(base = '#e8d8b8', style = 'stripes', accent) {
  const W = 128, H = 332;
  const [c, ctx] = canvas(W, H);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);
  accent = accent || shade(base, -0.06);
  ctx.fillStyle = accent;
  if (style === 'stripes') {
    for (let x = 0; x < W; x += 32) ctx.fillRect(x, 0, 12, H);
  } else if (style === 'dots') {
    for (let y = 10; y < H; y += 26)
      for (let x = (y / 26) % 2 ? 8 : 24; x < W; x += 32) {
        ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
      }
  } else if (style === 'diamond') {
    ctx.strokeStyle = accent; ctx.lineWidth = 2;
    for (let y = -64; y < H + 64; y += 32) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y + 64); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W, y); ctx.lineTo(0, y + 64); ctx.stroke();
    }
  } else if (style === 'tiles') {
    // bathroom / kitchen splashback: tiled lower half
    for (let y = H * 0.45; y < H; y += 21)
      for (let x = 0; x < W; x += 32) {
        ctx.fillStyle = shade(accent, (Math.random() - 0.5) * 0.04);
        ctx.fillRect(x + 1, y + 1, 30, 19);
      }
  }
  noise(ctx, W, H, 0.025, 1500);
  // dado rail + skirting
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(0, H * 0.62, W, 3);
  ctx.fillStyle = '#f4efe6';
  ctx.fillRect(0, H - 16, W, 16);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, H - 17, W, 2);
  return toTexture(c, false);
}

export function windowWall(base = '#e8d8b8', sunny = false) {
  const W = 128, H = 332;
  const [c, ctx] = canvas(W, H);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);
  const top = 50, bottom = sunny ? 300 : 210;
  const g = ctx.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, sunny ? '#ffe9a8' : '#8ec9ff');
  g.addColorStop(0.6, sunny ? '#fff6d8' : '#cfe9ff');
  g.addColorStop(1, sunny ? '#bfe28a' : '#9fd27a');
  ctx.fillStyle = g;
  ctx.fillRect(4, top, W - 8, bottom - top);
  // a few soft clouds / leaves
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(20 + Math.random() * 90, top + 20 + Math.random() * 50, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#fbfaf6';
  ctx.fillRect(0, top - 6, W, 8);
  ctx.fillRect(0, bottom - 2, W, 10);
  ctx.fillRect(0, top, 6, bottom - top);
  ctx.fillRect(W - 6, top, 6, bottom - top);
  ctx.fillRect(W / 2 - 3, top, 6, bottom - top);
  ctx.fillRect(0, (top + bottom) / 2 - 3, W, 6);
  ctx.fillStyle = '#f4efe6';
  ctx.fillRect(0, H - 16, W, 16);
  return toTexture(c, false);
}

export function ceiling() {
  const [c, ctx] = canvas(64, 64);
  ctx.fillStyle = '#f3efe8';
  ctx.fillRect(0, 0, 64, 64);
  noise(ctx, 64, 64, 0.03, 300);
  return toTexture(c);
}

export function rug(main = '#9b3d3d', border = '#e2c48a') {
  const [c, ctx] = canvas(256, 256);
  ctx.fillStyle = border;
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = main;
  ctx.fillRect(18, 18, 220, 220);
  ctx.strokeStyle = border;
  ctx.lineWidth = 4;
  ctx.strokeRect(34, 34, 188, 188);
  ctx.beginPath();
  ctx.moveTo(128, 50); ctx.lineTo(206, 128); ctx.lineTo(128, 206); ctx.lineTo(50, 128); ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = border;
  ctx.beginPath(); ctx.arc(128, 128, 16, 0, Math.PI * 2); ctx.fill();
  noise(ctx, 256, 256, 0.06, 3000);
  return toTexture(c, false);
}

export function fabric(base = '#5a7d9a') {
  const [c, ctx] = canvas(64, 64);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 64, 64);
  ctx.strokeStyle = 'rgba(0,0,0,0.06)';
  for (let i = 0; i < 64; i += 4) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 64); ctx.stroke();
  }
  noise(ctx, 64, 64, 0.05, 400);
  return toTexture(c);
}

export function books() {
  const [c, ctx] = canvas(128, 64);
  ctx.fillStyle = '#3b2a1a';
  ctx.fillRect(0, 0, 128, 64);
  let x = 2;
  const cols = ['#a33', '#36a', '#3a6', '#cb3', '#839', '#d72', '#eee', '#244'];
  while (x < 124) {
    const w = 5 + Math.random() * 8;
    const h = 40 + Math.random() * 22;
    ctx.fillStyle = cols[(Math.random() * cols.length) | 0];
    ctx.fillRect(x, 64 - h, w, h);
    x += w + 1;
  }
  return toTexture(c, false);
}

// ---------------------------------------------------------------- outdoor

export function grass(base = '#5f9e3d') {
  const [c, ctx] = canvas(128, 128);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 1400; i++) {
    ctx.strokeStyle = shade(base, (Math.random() - 0.4) * 0.18);
    const x = Math.random() * 128, y = Math.random() * 128;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 3, y - 3 - Math.random() * 4);
    ctx.stroke();
  }
  // mowing stripes
  ctx.fillStyle = 'rgba(255,255,255,0.035)';
  ctx.fillRect(0, 0, 64, 128);
  return toTexture(c);
}

export function decking(base = '#9b7653') {
  const [c, ctx] = canvas(256, 256);
  const boards = 7, w = 256 / boards;
  for (let i = 0; i < boards; i++) {
    ctx.fillStyle = shade(base, (Math.random() - 0.5) * 0.1);
    ctx.fillRect(i * w, 0, w - 4, 256);
    ctx.fillStyle = 'rgba(40,25,10,0.65)';
    ctx.fillRect(i * w + w - 4, 0, 4, 256);
    ctx.strokeStyle = 'rgba(60,35,15,0.15)';
    for (let g = 0; g < 3; g++) {
      ctx.beginPath();
      const gx = i * w + 4 + Math.random() * (w - 12);
      ctx.moveTo(gx, 0);
      ctx.bezierCurveTo(gx + 3, 80, gx - 3, 170, gx, 256);
      ctx.stroke();
    }
    ctx.fillStyle = '#555';
    for (const y of [20, 236]) { ctx.fillRect(i * w + 6, y, 3, 3); ctx.fillRect(i * w + w - 13, y, 3, 3); }
  }
  noise(ctx, 256, 256, 0.04);
  return toTexture(c);
}

export function gravel(base = '#b9ad9a') {
  const [c, ctx] = canvas(128, 128);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = shade(base, (Math.random() - 0.5) * 0.3);
    ctx.beginPath();
    ctx.arc(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  return toTexture(c);
}

export function soil(base = '#5b4030') {
  const [c, ctx] = canvas(128, 128);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 128, 128);
  noise(ctx, 128, 128, 0.12, 4000);
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  for (let y = 8; y < 128; y += 16) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(128, y + 2); ctx.stroke(); }
  return toTexture(c);
}

export function bark(base = '#8a5a35') {
  const [c, ctx] = canvas(128, 128);
  ctx.fillStyle = shade(base, -0.1);
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 260; i++) {
    ctx.save();
    ctx.translate(Math.random() * 128, Math.random() * 128);
    ctx.rotate(Math.random() * Math.PI);
    ctx.fillStyle = shade(base, (Math.random() - 0.5) * 0.25);
    ctx.fillRect(-5, -2, 10 + Math.random() * 6, 4);
    ctx.restore();
  }
  return toTexture(c);
}

// Wall-face textures: one tile = 1 m wide x full wall height.
export function hedge() {
  const [c, ctx] = canvas(128, 220);
  ctx.fillStyle = '#2f5f28';
  ctx.fillRect(0, 0, 128, 220);
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = ['#3d7a33', '#4a8c3c', '#2a5424', '#5a9c46'][(Math.random() * 4) | 0];
    ctx.beginPath();
    ctx.ellipse(Math.random() * 128, Math.random() * 220, 3 + Math.random() * 3, 2 + Math.random() * 2, Math.random() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // a few flowers
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = ['#f5f0ff', '#ffd6e8', '#fff3a8'][i % 3];
    ctx.beginPath(); ctx.arc(Math.random() * 128, 20 + Math.random() * 180, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 205, 128, 15);
  return toTexture(c, false);
}

export function fence() {
  const [c, ctx] = canvas(128, 230);
  ctx.fillStyle = '#5c4128';
  ctx.fillRect(0, 0, 128, 230);
  const n = 8, w = 128 / n;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = shade('#a07a52', (Math.random() - 0.5) * 0.12);
    ctx.fillRect(i * w + 1, 6 + Math.random() * 4, w - 2, 224);
    ctx.strokeStyle = 'rgba(60,35,15,0.25)';
    ctx.beginPath(); ctx.moveTo(i * w + w / 2, 10); ctx.lineTo(i * w + w / 2 + 2, 230); ctx.stroke();
  }
  ctx.fillStyle = '#7d5a3a';
  ctx.fillRect(0, 40, 128, 10);
  ctx.fillRect(0, 175, 128, 10);
  noise(ctx, 128, 230, 0.04, 800);
  return toTexture(c, false);
}

export function brick(withWindow = false) {
  const W = 128, H = 400;
  const [c, ctx] = canvas(W, H);
  ctx.fillStyle = '#d8cfc4';
  ctx.fillRect(0, 0, W, H);
  const bh = 10, bw = 32;
  for (let row = 0; row * bh < H; row++) {
    const off = row % 2 ? bw / 2 : 0;
    for (let x = -off; x < W; x += bw) {
      ctx.fillStyle = shade('#a8553a', (Math.random() - 0.5) * 0.12);
      ctx.fillRect(x + 1, row * bh + 1, bw - 2, bh - 2);
    }
  }
  if (withWindow) {
    const top = 110, bottom = 290;
    ctx.fillStyle = '#f2efe8';
    ctx.fillRect(10, top - 8, W - 20, bottom - top + 16);
    const g = ctx.createLinearGradient(0, top, 0, bottom);
    g.addColorStop(0, '#7f9fc0');
    g.addColorStop(1, '#3d5168');
    ctx.fillStyle = g;
    ctx.fillRect(18, top, W - 36, bottom - top);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.moveTo(24, top + 6); ctx.lineTo(56, top + 6); ctx.lineTo(24, top + 60); ctx.fill();
    ctx.fillStyle = '#e8d3b5'; // curtains
    ctx.fillRect(18, top, 16, bottom - top);
    ctx.fillRect(W - 34, top, 16, bottom - top);
    ctx.fillStyle = '#f2efe8';
    ctx.fillRect(W / 2 - 3, top, 6, bottom - top);
    ctx.fillStyle = '#bdb6aa';
    ctx.fillRect(6, bottom + 6, W - 12, 8);
  }
  noise(ctx, W, H, 0.03, 1500);
  return toTexture(c, false);
}

export function backDoor() {
  const W = 128, H = 400;
  const [c, ctx] = canvas(W, H);
  ctx.fillStyle = '#d8cfc4';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#f4f1ea';
  ctx.fillRect(8, 90, W - 16, H - 90);
  ctx.fillStyle = '#2f6b5e';
  ctx.fillRect(16, 98, W - 32, H - 98);
  const g = ctx.createLinearGradient(0, 120, 0, 300);
  g.addColorStop(0, '#9fc0d8');
  g.addColorStop(1, '#4b6a82');
  ctx.fillStyle = g;
  ctx.fillRect(28, 116, W - 56, 180);
  ctx.fillStyle = '#2f6b5e';
  ctx.fillRect(W / 2 - 3, 116, 6, 180);
  ctx.fillRect(28, 204, W - 56, 6);
  ctx.fillStyle = '#d4af37';
  ctx.beginPath(); ctx.arc(W - 30, 320, 5, 0, Math.PI * 2); ctx.fill();
  return toTexture(c, false);
}

// Vertical sky gradient used as a scene background.
export function sky() {
  const [c, ctx] = canvas(8, 256);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#4f9be0');
  g.addColorStop(0.55, '#9fd0f5');
  g.addColorStop(1, '#e8f4fb');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 8, 256);
  return toTexture(c, false);
}
// ---------------------------------------------------------------- park

export function pavement(base = '#c9c4ba') {
  const [c, ctx] = canvas(128, 128);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 128, 128);
  noise(ctx, 128, 128, 0.05, 2500);
  ctx.strokeStyle = 'rgba(70,65,60,0.45)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 126, 126);
  ctx.beginPath(); ctx.moveTo(64, 0); ctx.lineTo(64, 128); ctx.stroke();
  return toTexture(c);
}

export function sand(base = '#e6cf9c') {
  const [c, ctx] = canvas(128, 128);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 128, 128);
  noise(ctx, 128, 128, 0.08, 5000);
  ctx.strokeStyle = 'rgba(150,120,70,0.12)';
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.ellipse(Math.random() * 128, Math.random() * 128, 10 + Math.random() * 20, 4 + Math.random() * 6, Math.random() * 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  return toTexture(c);
}

export function pondWater(base = '#3f7f8f') {
  const [c, ctx] = canvas(128, 128);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * 128, y = Math.random() * 128;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 8, y - 3, x + 16, y); ctx.stroke();
  }
  return toTexture(c);
}

// Wrought-iron railing with transparent gaps.
export function railing() {
  const [c, ctx] = canvas(128, 180);
  ctx.clearRect(0, 0, 128, 180);
  ctx.fillStyle = '#1d1f22';
  for (let x = 4; x < 128; x += 16) {
    ctx.fillRect(x, 14, 4, 166);
    ctx.beginPath(); ctx.moveTo(x - 3, 16); ctx.lineTo(x + 2, 2); ctx.lineTo(x + 7, 16); ctx.fill(); // spear tops
  }
  ctx.fillRect(0, 26, 128, 5);
  ctx.fillRect(0, 160, 128, 6);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}