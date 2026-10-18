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
