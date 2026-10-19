// Bootstraps the renderer, menus, cat preview and the main loop.
import * as THREE from 'three';
import { Game } from './game.js';
import { Hud } from './hud.js';
import { Input, CONTROLS } from './input.js';
import { CatModel, FURS, BUILDS } from './models/cat.js';
import { HATS } from './models/hats.js';
import { initAudio, setVolume, sound, startNyanMusic, stopNyanMusic } from './audio.js';
import { getLeaderboard, addLeaderboardEntry, getSettings, saveSettings, formatTime } from './storage.js';
import { LEVELS, getLevel, nextLevel } from './level/levels.js';

const $ = (id) => document.getElementById(id);
const NAMES = ['Mittens', 'Socks', 'Oreo', 'Tux', 'Domino', 'Pepper', 'Panda', 'Felix', 'Sir Pounce', 'Biscuit', 'Moo', 'Jellybean', 'Captain Fluff', 'Noodle', 'Penguin'];

// ---------------------------------------------------------------- renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
$('game').appendChild(renderer.domElement);

const input = new Input(renderer.domElement);
const hud = new Hud();
const settings = getSettings();
setVolume(settings.volume);

// ---------------------------------------------------------------- cat preview (title + pause)
class Preview {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(32, 4 / 3, 0.05, 20);
    this.camera.position.set(0, 0.95, 2.6);
    this.camera.lookAt(0, 0.5, 0);
    this.scene.add(new THREE.HemisphereLight('#fff6e8', '#a0705a', 1.6));
    const key = new THREE.DirectionalLight('#ffffff', 2.2);
    key.position.set(1.5, 2.5, 2);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight('#ffd6a0', 1.4);
    rim.position.set(-2, 1.5, -2);
    this.scene.add(rim);
    const cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.1, 40), new THREE.MeshStandardMaterial({ color: '#c0485f', roughness: 0.9 }));
    cushion.position.y = -0.05;
    this.scene.add(cushion);
    const piping = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.025, 8, 48), new THREE.MeshStandardMaterial({ color: '#f2c14e', roughness: 0.5 }));
    piping.rotation.x = Math.PI / 2;
    this.scene.add(piping);
    this.turntable = new THREE.Group();
    this.scene.add(this.turntable);
    this.cat = new CatModel(settings.fur, settings.build);
    this.cat.root.scale.setScalar(1.25);
    this.turntable.add(this.cat.root);
    this.slot = null;
  }

  mount(slotId) {
    const slot = $(slotId);
    if (this.slot !== slot) {
      slot.appendChild(this.renderer.domElement);
      this.slot = slot;
    }
    this.resize();
  }

  resize() {
    if (!this.slot) return;
    const w = this.slot.clientWidth || 400, h = this.slot.clientHeight || 300;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  setHat(id) { this.cat.setHat(id); }

  // swap in a freshly built cat with a different coat/build, keeping the hat
  setLook(furId, buildId) {
    const hat = this.cat.hatId;
    this.turntable.remove(this.cat.root);
    this.cat = new CatModel(furId, buildId);
    this.cat.root.scale.setScalar(1.25);
    this.cat.setHat(hat);
    this.turntable.add(this.cat.root);
  }

  render(dt) {
    this.turntable.rotation.y += dt * 0.7;
    this.cat.update(dt, { speed: 0, grounded: true, idle: true });
    this.renderer.render(this.scene, this.camera);
  }
}
const preview = new Preview();

// ---------------------------------------------------------------- menus
let state = 'select'; // select | playing | paused | end
let game = null;
let hatIndex = Math.max(0, HATS.findIndex((h) => h.id === settings.hat));
let levelId = getLevel(settings.level).id;
const FUR_IDS = Object.keys(FURS);
let furIndex = Math.max(0, FUR_IDS.indexOf(settings.fur));
let buildId = BUILDS[settings.build] ? settings.build : 'regular';

function showScreen(id) {
  for (const s of ['screen-select', 'screen-pause', 'screen-end']) $(s).classList.toggle('hidden', s !== id);
  $('menu-root').classList.toggle('hidden', !id);
}

function renderControls() {
  const html = CONTROLS.map(([k, d]) => `<span>${k.split(' / ').map((x) => `<kbd>${x}</kbd>`).join(' ')}</span><span>${d}</span>`).join('');
  $('controls-grid-select').innerHTML = html;
  $('controls-grid-pause').innerHTML = html;
}

function renderLevelPicker() {
  $('level-picker').innerHTML = LEVELS.map((l) => {
    const best = getLeaderboard(l.id)[0];
    return `<button class="level-card ${l.id === levelId ? 'on' : ''}" data-id="${l.id}"><span class="num">Level ${l.number}</span>` +
      `<span class="nm">${l.name}</span><span class="best">${best ? 'Best: ' + formatTime(best.time) : 'No naps yet'}</span></button>`;
  }).join('');
  $('btn-start').textContent = `Start Level ${getLevel(levelId).number}: ${getLevel(levelId).name}`;
}

function selectLevel(id) {
  if (id === levelId) return;
  levelId = id;
  settings.level = id;
  saveSettings(settings);
  renderLevelPicker();
  renderLeaderboard($('leaderboard-select'));
  if (state === 'select') {
    if (game) game.dispose();
    game = makeAttract();
  }
}

function renderLeaderboard(el, highlightIndex = -1) {
  const def = getLevel(levelId);
  $(el.id === 'leaderboard-end' ? 'lb-title-end' : 'lb-title-select').textContent = `Leaderboard \u00b7 ${def.name}`;
  const list = getLeaderboard(levelId);
  const look = (e) => {
    const parts = [FURS[e.fur]?.name, e.build && e.build !== 'regular' ? BUILDS[e.build]?.name : '', e.hat && e.hat !== 'none' ? HATS.find((h) => h.id === e.hat)?.name : ''];
    const txt = parts.filter(Boolean).join(' \u00b7 ');
    return txt ? '(' + txt + ')' : '';
  };
  el.innerHTML = list.length
    ? list.map((e, i) => `<li class="${i === highlightIndex ? 'me' : ''}">${escapeHtml(e.name)} <span class="h">${look(e)}</span><span class="t">${formatTime(e.time)}</span></li>`).join('')
    : '<li class="empty">No naps recorded yet. Be the first!</li>';
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function setHat(i) {
  hatIndex = (i + HATS.length) % HATS.length;
  const hat = HATS[hatIndex];
  $('hat-name').textContent = hat.name;
  preview.setHat(hat.id);
  document.querySelectorAll('.hat-chip').forEach((c, j) => c.classList.toggle('on', j === hatIndex));
  settings.hat = hat.id;
  saveSettings(settings);
}

// CSS swatch that hints at each coat's colours and pattern
function furSwatch(f) {
  const belly = f.belly ?? f.body;
  if (f.pattern === 'stripes') return `repeating-linear-gradient(100deg, ${f.body} 0 5px, ${f.patternColors[0]} 5px 8px)`;
  if (f.pattern === 'patches') return `radial-gradient(circle at 30% 32%, ${f.patternColors[0]} 0 24%, transparent 25%), radial-gradient(circle at 70% 66%, ${f.patternColors[1] || f.patternColors[0]} 0 22%, transparent 23%), ${f.body}`;
  if (f.pattern === 'rainbow') return `linear-gradient(135deg, ${f.patternColors.join(', ')})`;
  if (f.face && f.face !== f.body && f.face !== belly) return `radial-gradient(circle at 50% 55%, ${f.face} 0 30%, ${f.body} 31%)`;
  return `linear-gradient(135deg, ${f.body} 0 55%, ${belly} 55%)`;
}

function setFur(i) {
  furIndex = (i + FUR_IDS.length) % FUR_IDS.length;
  const id = FUR_IDS[furIndex];
  $('fur-name').textContent = FURS[id].name;
  document.querySelectorAll('.fur-swatch').forEach((c, j) => c.classList.toggle('on', j === furIndex));
  preview.setLook(id, buildId);
  settings.fur = id;
  saveSettings(settings);
}

function setBuild(id) {
  buildId = BUILDS[id] ? id : 'regular';
  document.querySelectorAll('.build-chip').forEach((c) => c.classList.toggle('on', c.dataset.id === buildId));
  preview.setLook(FUR_IDS[furIndex], buildId);
  settings.build = buildId;
  saveSettings(settings);
}

function buildLookPickers() {
  $('fur-grid').innerHTML = FUR_IDS.map((id, i) => `<button class="fur-swatch" data-i="${i}" title="${FURS[id].name}" aria-label="${FURS[id].name}" style="background:${furSwatch(FURS[id])}"></button>`).join('');
  $('fur-grid').addEventListener('click', (e) => { const b = e.target.closest('.fur-swatch'); if (b) setFur(Number(b.dataset.i)); });
  $('build-grid').innerHTML = Object.entries(BUILDS).map(([id, b]) => `<button class="hat-chip build-chip" data-id="${id}">${b.name}</button>`).join('');
  $('build-grid').addEventListener('click', (e) => { const b = e.target.closest('.build-chip'); if (b) setBuild(b.dataset.id); });
  $('fur-prev').addEventListener('click', () => setFur(furIndex - 1));
  $('fur-next').addEventListener('click', () => setFur(furIndex + 1));
}

function buildHatGrid() {
  $('hat-grid').innerHTML = HATS.map((h, i) => `<button class="hat-chip" data-i="${i}">${h.name}</button>`).join('');
  $('hat-grid').addEventListener('click', (e) => {
    const b = e.target.closest('.hat-chip');
    if (b) setHat(Number(b.dataset.i));
  });
}

function catName() {
  const n = $('cat-name').value.trim();
  return n || 'Mittens';
}

function startGame() {
  initAudio();
  const name = catName();
  settings.name = name;
  saveSettings(settings);
  if (game) game.dispose();
  game = new Game(renderer, hud, {
    levelId, name, hat: HATS[hatIndex].id, fur: FUR_IDS[furIndex], build: buildId, settings,
    onWin: (time, goal, info) => endScreen(true, time, goal, null, info),
    onLose: (reason) => endScreen(false, 0, null, reason),
  });
  game.resize(window.innerWidth, window.innerHeight);
  state = 'playing';
  showScreen(null);
  hud.show(true);
  input.enabled = true;
  grabMouse();
  $('click-to-play').classList.add('hidden');
}

// Fullscreen + mouse capture. Must be called from a click/keypress.
let fullscreenBlocked = !document.documentElement.requestFullscreen;

function enterFullscreen() {
  if (fullscreenBlocked || document.fullscreenElement) return;
  document.documentElement.requestFullscreen({ navigationUI: 'hide' })
    .then(() => input.requestLock())
    .catch(() => { fullscreenBlocked = true; });
  // some embedded browsers silently ignore the request
  setTimeout(() => { if (!document.fullscreenElement) fullscreenBlocked = true; }, 1500);
}

function grabMouse() {
  if (settings.fullscreen) enterFullscreen();
  input.requestLock();
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else { fullscreenBlocked = false; enterFullscreen(); }
}

function setFullscreenPref(on) {
  settings.fullscreen = on;
  $('set-fullscreen').checked = on;
  $('set-fullscreen-select').checked = on;
  saveSettings(settings);
}

// once fullscreen kicks in, (re)try capturing the mouse
document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement && state === 'playing' && !input.locked) input.requestLock();
});

// Diagnostic line on the pause screen: did the browser let us capture the mouse?
function showMouseStatus() {
  const ua = navigator.userAgent;
  const browser = (ua.match(/Edg\/(\d+)/) && 'Edge ' + ua.match(/Edg\/(\d+)/)[1]) || (ua.match(/Chrome\/(\d+)/) && 'Chrome ' + ua.match(/Chrome\/(\d+)/)[1]) || (ua.match(/Firefox\/(\d+)/) && 'Firefox ' + ua.match(/Firefox\/(\d+)/)[1]) || 'browser';
  let html;
  if (input.lockWorked) html = '<b>Mouse capture: working</b>';
  else if (input.lockFailed) html = '<b>Mouse capture refused</b> by ' + browser + ': ' + escapeHtml(input.lockError || 'no reason given') + '<br>Using free-cursor mode instead.';
  else html = '<b>Mouse capture:</b> not tried yet (click the game).';
  html += '<br>Fullscreen: ' + (document.fullscreenElement ? 'on' : fullscreenBlocked ? 'blocked by the browser' : 'off');
  $('mouse-status').innerHTML = html;
}

function pause() {
  if (state !== 'playing') return;
  state = 'paused';
  input.enabled = false;
  input.releaseLock();
  showMouseStatus();
  $('pause-cat-name').textContent = `${game.player.name}  \u00b7  ${FURS[FUR_IDS[furIndex]].name}  \u00b7  ${HATS[hatIndex].name}`;
  preview.mount('preview-slot-pause');
  showScreen('screen-pause');
  stopNyanMusicIfPaused();
}

function stopNyanMusicIfPaused() {
  if (game?.player.nyan) stopNyanMusic();
}

function resume() {
  if (state !== 'paused') return;
  state = 'playing';
  showScreen(null);
  input.enabled = true;
  grabMouse();
  if (game.player.nyan && settings.music) startNyanMusic();
}

function toMenu() {
  state = 'select';
  input.enabled = false;
  input.releaseLock();
  hud.show(false);
  if (game) game.dispose();
  game = makeAttract();
  renderLeaderboard($('leaderboard-select'));
  renderLevelPicker();
  preview.mount('preview-slot-select');
  showScreen('screen-select');
}

function endScreen(won, time, goal, reason, info = {}) {
  state = 'end';
  input.enabled = false;
  input.releaseLock();
  const name = game.player.name;
  let idx = -1;
  if (won) {
    idx = addLeaderboardEntry(levelId, { name, hat: HATS[hatIndex].id, fur: FUR_IDS[furIndex], build: buildId, time, date: new Date().toISOString() });
    $('end-title').textContent = 'Nap time!';
    $('end-sub').textContent = `${name} ${game.def.clearedText} and curled up on ${goal.name}.`;
    const bonusNote = info.bonus ? `<small>Includes a -${info.bonus}s mischief bonus for ${info.smashed} smashed ornament${info.smashed === 1 ? '' : 's'}</small>` : '';
    $('end-time').innerHTML = `${formatTime(time)}<small>${idx === 0 ? 'NEW BEST TIME!' : idx >= 0 ? `#${idx + 1} on the leaderboard` : 'Not quite a top 10 nap'}</small>${bonusNote}`;
  } else {
    $('end-title').textContent = reason === 'time' ? 'The sun went down...' : 'Out of lives!';
    $('end-sub').textContent = reason === 'time'
      ? `The sunny spot is gone. ${name} grumpily naps on the cold floor.`
      : `${name} used up all nine lives (well, all five fish). Try again!`;
    const left = game.enemies.filter((e) => e.alive).length;
    $('end-time').innerHTML = `${left} pest${left === 1 ? '' : 's'} left<small>Tip: climb furniture to escape the dog, and meow at humans for fish.</small>`;
  }
  renderLeaderboard($('leaderboard-end'), idx);
  const next = won ? nextLevel(levelId) : null;
  $('btn-next').classList.toggle('hidden', !next);
  if (next) $('btn-next').textContent = `Next: Level ${next.number} - ${next.name}`;
  showScreen('screen-end');
}

function makeAttract() {
  const g = new Game(renderer, hud, { attract: true, levelId, name: 'Menu', hat: HATS[hatIndex].id, fur: FUR_IDS[furIndex], build: buildId, settings });
  g.resize(window.innerWidth, window.innerHeight);
  return g;
}

// ---------------------------------------------------------------- wiring
$('cat-name').value = settings.name || NAMES[(Math.random() * NAMES.length) | 0];
$('cat-name').addEventListener('input', () => { settings.name = $('cat-name').value; saveSettings(settings); });
$('cat-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') startGame(); });
$('name-random').addEventListener('click', () => {
  let n;
  do n = NAMES[(Math.random() * NAMES.length) | 0]; while (n === $('cat-name').value && NAMES.length > 1);
  $('cat-name').value = n;
  settings.name = n;
  saveSettings(settings);
  initAudio();
  sound.meow(1.1);
  preview.cat.meow();
});
$('hat-prev').addEventListener('click', () => setHat(hatIndex - 1));
$('hat-next').addEventListener('click', () => setHat(hatIndex + 1));
$('btn-start').addEventListener('click', startGame);
$('btn-resume').addEventListener('click', resume);
$('btn-restart').addEventListener('click', startGame);
$('btn-quit').addEventListener('click', toMenu);
$('btn-again').addEventListener('click', startGame);
$('btn-next').addEventListener('click', () => { const n = nextLevel(levelId); if (n) { levelId = n.id; settings.level = n.id; saveSettings(settings); startGame(); } });
$('level-picker').addEventListener('click', (e) => { const c = e.target.closest('.level-card'); if (c) selectLevel(c.dataset.id); });
$('btn-menu').addEventListener('click', toMenu);
$('set-volume').value = settings.volume;
$('set-volume').addEventListener('input', (e) => { settings.volume = Number(e.target.value); setVolume(settings.volume); saveSettings(settings); });
$('set-sens').value = settings.sensitivity;
$('set-sens').addEventListener('input', (e) => { settings.sensitivity = Number(e.target.value); saveSettings(settings); });
$('set-fullscreen').addEventListener('change', (e) => setFullscreenPref(e.target.checked));
$('set-fullscreen-select').addEventListener('change', (e) => setFullscreenPref(e.target.checked));
setFullscreenPref(settings.fullscreen);
$('set-music').checked = settings.music;
$('set-music').addEventListener('change', (e) => { settings.music = e.target.checked; saveSettings(settings); });

input.onPointerUnlock = () => { if (state === 'playing') pause(); };
window.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) return;
  if (e.code === 'KeyF' && state === 'playing') toggleFullscreen();
  if (e.code === 'Escape' || e.code === 'KeyP') {
    if (state === 'playing') pause();
    else if (state === 'paused' && e.code === 'KeyP') resume();
  }
});
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  game?.resize(window.innerWidth, window.innerHeight);
  preview.resize();
});

renderControls();
buildHatGrid();
buildLookPickers();
setHat(hatIndex);
setFur(furIndex);
setBuild(buildId);
renderLeaderboard($('leaderboard-select'));
renderLevelPicker();
preview.mount('preview-slot-select');
game = makeAttract();
$('loading').classList.add('hidden');

// Mouse capture hint + edge-turn glows (free-cursor mode when the browser refuses capture)
function updateMouseHint() {
  const hint = $('click-to-play');
  let text = '';
  if (!input.locked) {
    if (!input.lockFailed) text = 'Click the game to capture the mouse for full mouse-look';
    else if (!document.fullscreenElement && !fullscreenBlocked) text = "Free mouse mode: press F for fullscreen so the cursor can't leave the game";
    else if (game.time < 12) text = 'Free mouse mode: move the mouse to turn, rest it at a screen edge to keep turning';
  }
  if (hint.textContent !== text) hint.textContent = text;
  hint.classList.toggle('hidden', !text);
  const edge = input.edgeTurn;
  $('edge-left').style.opacity = Math.max(0, -edge);
  $('edge-right').style.opacity = Math.max(0, edge);
}

// ---------------------------------------------------------------- loop
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (window.__meowFreeze) { game.render(); return; } // debug: lets tests step the game manually
  if (state === 'playing') {
    updateMouseHint();
    game.update(dt, input, settings.sensitivity);
  } else if (state === 'select' || state === 'end') {
    game.update(dt, input, 0);
  }
  game.render();
  if (state === 'select' || state === 'paused') preview.render(dt);
  input.endFrame();
}
requestAnimationFrame(frame);

// handy for debugging from the console
window.__meow = { get game() { return game; }, get state() { return state; }, startGame, pause, resume };
