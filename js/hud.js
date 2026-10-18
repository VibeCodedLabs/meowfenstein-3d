// HTML HUD: fish health, squeaky-toy ammo, jump fatigue, kill streak, pests left,
// timer, dog status, minimap and floating world-space labels.
import * as THREE from 'three';
import { MAX_HEALTH, MAX_AMMO, STREAK_NEEDED, STREAK_WINDOW } from './entities/player.js';
import { formatTime } from './storage.js';

const $ = (id) => document.getElementById(id);

const FISH_SVG = (fill) => `<svg viewBox="0 0 26 18"><path d="M2 9 C6 2 14 1 19 9 C14 17 6 16 2 9 Z M19 9 L25 3 L24 9 L25 15 Z" fill="${fill}" stroke="#2a1a10" stroke-width="1.2"/><circle cx="7" cy="8" r="1.3" fill="#2a1a10"/></svg>`;
const DUCK_SVG = `<svg viewBox="0 0 26 22"><ellipse cx="12" cy="15" rx="10" ry="6" fill="#ffd60a" stroke="#7a5a00" stroke-width="1"/><circle cx="17" cy="7" r="5" fill="#ffd60a" stroke="#7a5a00" stroke-width="1"/><path d="M21 7 L26 8 L21 10 Z" fill="#ff7b00"/><circle cx="18" cy="6" r="1" fill="#111"/></svg>`;

export class Hud {
  constructor() {
    this.el = $('hud');
    this.fish = $('hud-fish');
    this.ammo = $('hud-ammo');
    this.fatigue = $('hud-fatigue');
    this.streak = $('hud-streak');
    this.labelsEl = $('labels');
    this.labels = [];
    this.minimap = $('minimap');
    this.mm = this.minimap.getContext('2d');
    this.lastRoom = null;
    this.vecTmp = new THREE.Vector3();
    this.mapCache = null;
    this.buildFish();
  }

  buildFish() {
    this.fish.innerHTML = '';
    this.fishFills = [];
    for (let i = 0; i < 5; i++) {
      const d = document.createElement('div');
      d.className = 'icon fish-icon';
      d.innerHTML = FISH_SVG('rgba(255,255,255,0.15)') + `<div class="fill">${FISH_SVG('#ff9f43')}</div>`;
      this.fish.appendChild(d);
      this.fishFills.push(d.querySelector('.fill'));
    }
  }

  show(on) { this.el.classList.toggle('hidden', !on); }

  reset(name) {
    $('hud-name').textContent = name;
    this.feedClear();
    this.labels.forEach((l) => l.el.remove());
    this.labels = [];
    this.lastRoom = null;
    this.mapCache = null;
    $('vignette').style.opacity = 0;
    $('nyan-overlay').classList.remove('on');
  }

  feed(text) {
    const box = $('hud-feed');
    const d = document.createElement('div');
    d.className = 'feed-item';
    d.textContent = text;
    box.prepend(d);
    while (box.children.length > 5) box.lastChild.remove();
    setTimeout(() => d.remove(), 4000);
  }

  feedClear() { $('hud-feed').innerHTML = ''; }

  // getPos: () => Vector3 (follows a moving thing) or a Vector3
  label(text, getPos, cls = 'bubble', life = 2.5, rise = 0) {
    const el = document.createElement('div');
    el.className = 'label ' + cls;
    el.textContent = text;
    this.labelsEl.appendChild(el);
    const l = { el, getPos: typeof getPos === 'function' ? getPos : () => getPos, life, max: life, rise, permanent: life === Infinity };
    this.labels.push(l);
    return l;
  }

  removeLabel(l) {
    l.el.remove();
    this.labels = this.labels.filter((x) => x !== l);
  }

  flashDamage() {
    const v = $('vignette');
    v.style.transition = 'none';
    v.style.opacity = 1;
    setTimeout(() => { v.style.transition = 'opacity .5s'; v.style.opacity = 0; }, 40);
  }

  roomBanner(name) {
    const r = $('hud-room');
    r.textContent = name;
    r.classList.remove('hidden');
    r.style.animation = 'none';
    void r.offsetWidth;
    r.style.animation = '';
  }

  update(dt, game) {
    const p = game.player;
    // health as fish
    const per = MAX_HEALTH / 5;
    this.fishFills.forEach((f, i) => {
      const frac = Math.max(0, Math.min(1, (p.health - i * per) / per));
      f.style.width = frac * 26 + 'px';
    });
    // ammo
    const ammoKey = p.ammo;
    if (this.ammoKey !== ammoKey) {
      this.ammoKey = ammoKey;
      this.ammo.innerHTML = Array.from({ length: Math.min(p.ammo, MAX_AMMO) }, () => `<div class="icon">${DUCK_SVG}</div>`).join('') +
        (p.ammo === 0 ? '<span class="ammo-count" style="color:#ff8080">empty</span>' : `<span class="ammo-count">${p.ammo}</span>`);
    }
    // jump fatigue (fills up as you jump)
    const fatigue = 100 - p.stamina;
    this.fatigue.style.width = fatigue + '%';
    this.fatigue.style.background = p.stamina < 24 ? '#ff4d4d' : fatigue > 50 ? '#ffb347' : '#7be27b';
    // streak
    const streakKey = `${p.streak}|${p.nyanCharged}|${p.nyan}`;
    if (this.streakKey !== streakKey) {
      this.streakKey = streakKey;
      this.streak.innerHTML = p.nyan ? '<b style="color:#ffe14d">NYAN!</b>' :
        Array.from({ length: STREAK_NEEDED }, (_, i) => `<div class="streak-pip ${i < p.streak ? 'on' : ''}"></div>`).join('') +
        (p.nyanCharged ? ' <b>READY [Q]</b>' : '');
    }
    const streakFade = p.streak > 0 && !p.nyanCharged && !p.nyan ? Math.max(0.35, 1 - (game.time - p.lastKillTime) / STREAK_WINDOW) : 1;
    this.streak.style.opacity = streakFade;
    $('hud-nyan-banner').classList.toggle('hidden', !p.nyanCharged || p.nyan || game.over);
    $('nyan-overlay').classList.toggle('on', p.nyan);

    // enemies
    const rats = game.enemies.filter((e) => e.alive && e.kind === 'rat').length;
    const birds = game.enemies.filter((e) => e.alive && e.kind === 'bird').length;
    $('hud-enemy-count').textContent = rats + birds;
    $('hud-enemy-break').textContent = rats + birds === 0 ? 'All clear! Time for a nap.' : `${rats} rat${rats === 1 ? '' : 's'} · ${birds} magpie${birds === 1 ? '' : 's'}`;

    // timer
    $('hud-timer').textContent = formatTime(game.time);
    const left = Math.max(0, game.timeLimit - game.time);
    const tl = $('hud-timelimit');
    tl.textContent = `Sunset in ${formatTime(left).replace(/\.\d$/, '')}`;
    tl.classList.toggle('warn', left < 45);

    // dog
    const dog = game.dog;
    const hot = dog.alerted || dog.state === 'bark';
    $('hud-dog').classList.toggle('alert', hot);
    $('hud-dog-meter').style.width = dog.suspicion * 100 + '%';
    $('hud-dog-meter').style.background = hot ? '#ff4d4d' : dog.suspicion > 0.5 ? '#ffb347' : '#ffe066';
    $('hud-dog-text').textContent = dog.statusText;

    // goal arrow
    const arrow = $('hud-goal-arrow');
    if (game.goalsOpen && !p.sleeping) {
      const g = game.nearestGoal();
      const ang = Math.atan2(g.x - p.x, g.z - p.z) - p.yaw;
      arrow.classList.remove('hidden');
      // arrow glyph points right; screen-up = forward
      arrow.style.transform = `rotate(${-ang * 180 / Math.PI - 90}deg)`;
    } else arrow.classList.add('hidden');

    // room banner
    const room = game.level.roomAt(p.x, p.z);
    if (room && room !== this.lastRoom && game.level.cell(Math.floor(p.x), Math.floor(p.z)) !== 'd') {
      if (this.lastRoom !== null) this.roomBanner(game.roomName(room));
      this.lastRoom = room;
    }

    this.updateLabels(dt, game.camera);
    this.drawMinimap(game);
  }

  updateLabels(dt, camera) {
    const W = window.innerWidth, H = window.innerHeight;
    for (const l of [...this.labels]) {
      if (!l.permanent) {
        l.life -= dt;
        if (l.life <= 0) { this.removeLabel(l); continue; }
      }
      const pos = this.vecTmp.copy(l.getPos());
      pos.y += l.rise * (l.max - l.life);
      pos.project(camera);
      if (pos.z > 1 || pos.z < -1) { l.el.style.display = 'none'; continue; }
      l.el.style.display = '';
      l.el.style.left = ((pos.x + 1) / 2) * W + 'px';
      l.el.style.top = ((1 - pos.y) / 2) * H + 'px';
      if (!l.permanent) l.el.style.opacity = Math.min(1, l.life / 0.4);
    }
  }

  drawMinimap(game) {
    const L = game.level, ctx = this.mm;
    const cw = this.minimap.width, ch = this.minimap.height;
    const s = Math.min(cw / L.w, ch / L.h);
    const ox = (cw - L.w * s) / 2, oy = (ch - L.h * s) / 2;
    if (!this.mapCache) {
      const c = document.createElement('canvas');
      c.width = cw; c.height = ch;
      const x = c.getContext('2d');
      for (let z = 0; z < L.h; z++)
        for (let xx = 0; xx < L.w; xx++) {
          const cell = L.cell(xx, z);
          const wall = L.isWallChar(cell), win = (game.def.windowChars || 'G').includes(cell);
          x.fillStyle = !wall ? 'rgba(255,240,220,0.22)' : win ? '#7fb8e6' : '#2b2233';
          x.fillRect(ox + xx * s, oy + z * s, s + 0.5, s + 0.5);
        }
      this.mapCache = c;
    }
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(this.mapCache, 0, 0);
    const dot = (x, z, r, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(ox + x * s, oy + z * s, r, 0, Math.PI * 2);
      ctx.fill();
    };
    for (const h of game.humans) dot(h.x, h.z, 3.2, '#5cd65c');
    const alive = game.enemies.filter((e) => e.alive);
    if (alive.length <= 3) for (const e of alive) dot(e.x, e.z, 2.4, '#ff5c5c');
    if (game.goalsOpen) for (const g of game.goals) dot(g.x, g.z, 3 + Math.sin(game.time * 6), '#ffe066');
    const d = game.dog;
    dot(d.x, d.z, 4, d.alerted ? '#ff2020' : '#c87f3a');
    // player arrow
    const p = game.player;
    ctx.save();
    ctx.translate(ox + p.x * s, oy + p.z * s);
    ctx.rotate(-p.yaw);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(0, 6); ctx.lineTo(4, -4); ctx.lineTo(0, -2); ctx.lineTo(-4, -4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
