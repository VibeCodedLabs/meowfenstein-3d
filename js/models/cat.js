// Procedural cat built from primitives, plus an animation rig.
// Local +Z is forward, feet at y = 0. Coats (FURS) and body shapes (BUILDS) are
// plain data, so new ones can be added without touching the rig.
import * as THREE from 'three';
import { buildHat } from './hats.js';

// Colour slots: body, belly, head, face (muzzle + chin), blaze (forehead stripe),
// ears, legs, socks, paws, tail. Unset slots fall back to a sensible neighbour.
// pattern: 'stripes' (tabby), 'patches' (calico/tortie) or 'rainbow', painted in
// patternColors over the slots listed in patternOn.
export const FURS = {
  tuxedo: { name: 'Tuxedo', body: '#1b1b1f', belly: '#f4f2ee', face: '#f4f2ee', blaze: '#f4f2ee', socks: '#f4f2ee', eye: '#8fd16a' },
  ginger: {
    name: 'Ginger Tabby', body: '#d9822b', belly: '#f6e3c4', face: '#f3d9b0', paws: '#f6e3c4', eye: '#e0a526', nose: '#d9737f',
    pattern: 'stripes', patternColors: ['#a4521a'],
  },
  silver: {
    name: 'Silver Tabby', body: '#a3a6ab', belly: '#e3e4e6', face: '#e6e7e9', paws: '#e3e4e6', eye: '#7cc576',
    pattern: 'stripes', patternColors: ['#3c3f45'],
  },
  calico: {
    name: 'Calico', body: '#f5f1e8', belly: '#fbf8f2', face: '#fbf8f2', eye: '#c9a227',
    pattern: 'patches', patternColors: ['#e0883a', '#2b2420'], patternOn: ['body', 'head', 'tail'],
  },
  tortie: {
    name: 'Tortoiseshell', body: '#2b2420', belly: '#3b2e25', face: '#3b2e25', eye: '#d4a017', nose: '#5a3a3a',
    pattern: 'patches', patternColors: ['#c86a28', '#8a4a1e'],
  },
  siamese: {
    name: 'Siamese', body: '#efe3cc', belly: '#f6efe0', head: '#e8d9bd', face: '#4a3428', blaze: '#4a3428', ears: '#4a3428',
    legs: '#b49a7a', socks: '#4a3428', tail: '#4a3428', eye: '#5aa7e6', nose: '#3a2a22', innerEar: '#6b4a3a',
  },
  black: { name: 'Black Panther', body: '#141416', eye: '#f2c200', nose: '#3a3034', innerEar: '#3a2a30' },
  white: { name: 'Snowball', body: '#f7f6f2', eye: '#5aa7e6', eye2: '#e6b34a', nose: '#f0a3b0' },
  blue: { name: 'Russian Blue', body: '#7d8a99', belly: '#8d99a7', eye: '#6fd36f', nose: '#5d6470', innerEar: '#9a8a96' },
  rainbow: {
    name: 'Rainbow', body: '#ffffff', belly: '#ffffff', face: '#ffffff', eye: '#d06bff', nose: '#ff6fb5',
    pattern: 'rainbow', patternColors: ['#ff1a40', '#ff9a1a', '#ffe81a', '#33dd33', '#1a9cff', '#7a3cff'],
  },
};

// Body shapes. Purely cosmetic: every build uses the same hitbox and speed.
export const BUILDS = {
  regular: { name: 'Regular' },
  chonky: { name: 'Chonky', torso: [1.42, 1.22, 1.1], head: 1.08, headY: 0.04, leg: 0.86, legX: 1.3, tailR: 1.25, cheeks: 1.3 },
  kitten: { name: 'Kitten', scale: 0.78, head: 1.32, eyes: 1.3, leg: 0.92, tailLen: 0.8, ears: 1.15 },
  floof: { name: 'Floof', torso: [1.12, 1.08, 1.04], cheeks: 1.65, tailR: 2.1, ruff: true, tufts: true },
};

function std(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...extra });
}

function sphere(r, mat, sx = 1, sy = 1, sz = 1, seg = 18) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(8, seg - 4)), mat);
  m.scale.set(sx, sy, sz);
  return m;
}

// Fill in unset slots from their neighbours.
function resolveFur(f) {
  const body = f.body;
  const head = f.head ?? body;
  const legs = f.legs ?? body;
  const socks = f.socks ?? legs;
  return {
    body, belly: f.belly ?? body, head, face: f.face ?? f.belly ?? head, blaze: f.blaze ?? head,
    ears: f.ears ?? head, legs, socks, paws: f.paws ?? socks, tail: f.tail ?? body,
    eye: f.eye, eye2: f.eye2 ?? f.eye, nose: f.nose ?? '#e88fa0', innerEar: f.innerEar ?? '#e9a3b0',
  };
}

// Paint a coat pattern over a slot colour. 'u' runs stripes around a sphere
// (down the flanks from the spine); 'v' makes rings (legs and tail).
function patternTexture(fur, base, dir) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 128);
  const cols = fur.patternColors;
  if (fur.pattern === 'stripes') {
    ctx.fillStyle = cols[0];
    if (dir === 'u') {
      ctx.globalAlpha = 0.85;
      ctx.fillRect(0, 0, 256, 14); // darker spine / crown
      for (let i = 0; i < 14; i++) {
        const x = (i / 14) * 256 + Math.random() * 6;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        for (let y = 0; y <= 128; y += 16) ctx.lineTo(x + Math.sin(y * 0.08 + i) * 5 + (y / 128) * 4, y);
        for (let y = 128; y >= 0; y -= 16) ctx.lineTo(x + 6 + Math.sin(y * 0.08 + i) * 5 - (y / 128) * 3, y);
        ctx.fill();
      }
    } else {
      for (let i = 0; i < 4; i++) ctx.fillRect(0, i * 32 + 8, 256, 11);
    }
  } else if (fur.pattern === 'patches') {
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = cols[i % cols.length];
      ctx.beginPath();
      const x = Math.random() * 256, y = Math.random() * 128, r = 18 + Math.random() * 26;
      for (let a = 0; a < Math.PI * 2; a += 0.5) {
        const rr = r * (0.7 + Math.random() * 0.5);
        a === 0 ? ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      ctx.fill();
    }
  } else if (fur.pattern === 'rainbow') {
    const n = cols.length * 2;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = cols[i % cols.length];
      if (dir === 'u') ctx.fillRect((i / n) * 256, 0, 256 / n + 1, 128);
      else ctx.fillRect(0, (i / n) * 128, 256, 128 / n + 1);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

function popTartTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f6c98b';
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = '#ff99cc';
  ctx.beginPath();
  ctx.roundRect(14, 14, 100, 100, 18);
  ctx.fill();
  const cols = ['#ff3399', '#cc00cc', '#ff6699', '#9933ff'];
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = cols[i % cols.length];
    ctx.fillRect(22 + Math.random() * 84, 22 + Math.random() * 84, 6, 6);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class CatModel {
  constructor(furId = 'tuxedo', buildId = 'regular') {
    const furDef = FURS[furId] || FURS.tuxedo;
    const build = BUILDS[buildId] || BUILDS.regular;
    const F = resolveFur(furDef);
    this.furId = FURS[furId] ? furId : 'tuxedo';
    this.buildId = BUILDS[buildId] ? buildId : 'regular';
    this.root = new THREE.Group();
    this.body = new THREE.Group();
    this.root.add(this.body);

    // one material per colour slot; patterned slots get a painted texture
    const patternOn = new Set(furDef.pattern ? furDef.patternOn || ['body', 'head', 'legs', 'tail'] : []);
    const slotMat = (slot, dir = 'u') => (patternOn.has(slot)
      ? std('#ffffff', { map: patternTexture(furDef, F[slot], dir) })
      : std(F[slot]));
    const M = (this.mats = {
      body: slotMat('body'), belly: slotMat('belly'), head: slotMat('head'), face: slotMat('face'),
      blaze: slotMat('blaze'), ears: slotMat('ears'), legs: slotMat('legs', 'v'), socks: slotMat('socks', 'v'),
      paws: slotMat('paws'), tail: slotMat('tail', 'v'),
    });
    const mPink = std(F.nose);
    const mInner = std(F.innerEar);
    const eyeMat = (c) => std(c, { roughness: 0.2, emissive: c, emissiveIntensity: 0.15 });
    const mEyes = [eyeMat(F.eye), eyeMat(F.eye2)];
    const mPupil = std('#050505', { roughness: 0.1 });
    this.flashMats = [...new Set(Object.values(M))];

    // build proportions
    const leg = build.leg ?? 1, scale = build.scale ?? 1;
    this.body.scale.setScalar(scale);
    this.baseY = -(0.29 - 0.272 * leg - 0.018) * scale; // keep paws on the floor with shorter legs
    this.headY = 0.4 + (build.headY ?? 0);

    // torso
    this.torso = new THREE.Group();
    this.body.add(this.torso);
    const t1 = sphere(1, M.body, 0.16, 0.15, 0.3); t1.position.set(0, 0.3, 0);
    const belly = sphere(1, M.belly, 0.125, 0.11, 0.24); belly.position.set(0, 0.245, 0.02);
    const chest = sphere(1, M.belly, 0.11, 0.135, 0.1); chest.position.set(0, 0.3, 0.215);
    const hip = sphere(1, M.body, 0.15, 0.14, 0.14); hip.position.set(0, 0.31, -0.19);
    this.torso.add(t1, belly, chest, hip);
    if (build.ruff) {
      const ruff = sphere(1, M.belly, 0.15, 0.13, 0.12); ruff.position.set(0, 0.36, 0.22);
      this.torso.add(ruff);
    }
    if (build.torso) this.torso.scale.set(...build.torso);

    // pop tart body for Nyan mode (hidden by default)
    const tart = popTartTexture();
    const crust = std('#f0bf7f');
    const frost = std('#ffffff', { map: tart });
    this.popTart = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.56), [frost, frost, frost, crust, crust, crust]);
    this.popTart.position.set(0, 0.32, -0.02);
    this.popTart.visible = false;
    this.body.add(this.popTart);

    // head
    this.head = new THREE.Group();
    this.head.position.set(0, this.headY, 0.27);
    this.head.scale.setScalar(build.head ?? 1);
    this.body.add(this.head);
    const cheeks = build.cheeks ?? 1;
    const skull = sphere(0.135, M.head); skull.position.set(0, 0.06, 0.06);
    const cheekL = sphere(0.07, M.head, cheeks, 0.85, 0.9); cheekL.position.set(0.075 * (0.8 + cheeks * 0.2), 0.025, 0.1);
    const cheekR = cheekL.clone(); cheekR.position.x = -cheekL.position.x;
    const muzzle = sphere(1, M.face, 0.085, 0.06, 0.06); muzzle.position.set(0, 0.012, 0.165);
    const blaze = sphere(1, M.blaze, 0.03, 0.07, 0.05); blaze.position.set(0, 0.09, 0.175);
    const chin = sphere(1, M.face, 0.05, 0.035, 0.05); chin.position.set(0, -0.04, 0.14);
    const nose = sphere(1, mPink, 0.022, 0.016, 0.014); nose.position.set(0, 0.05, 0.218);
    this.head.add(skull, cheekL, cheekR, muzzle, blaze, chin, nose);

    const eyeS = build.eyes ?? 1;
    this.eyes = [];
    for (const [i, s] of [[0, 1], [1, -1]]) {
      const eye = new THREE.Group();
      eye.position.set(0.055 * s, 0.085, 0.163);
      const ball = sphere(0.03 * eyeS, mEyes[i]);
      const pupil = sphere(1, mPupil, 0.009 * eyeS, 0.024 * eyeS, 0.01 * eyeS); pupil.position.z = 0.025 * eyeS;
      const glint = sphere(0.006 * eyeS, std('#fff', { emissive: '#fff' })); glint.position.set(0.008 * eyeS, 0.01 * eyeS, 0.029 * eyeS);
      eye.add(ball, pupil, glint);
      eye.rotation.y = 0.25 * s;
      this.head.add(eye);
      this.eyes.push(eye);
    }

    this.ears = [];
    const earS = build.ears ?? 1;
    for (const s of [1, -1]) {
      const ear = new THREE.Group();
      ear.position.set(0.075 * s, 0.16, 0.04);
      ear.rotation.z = -0.32 * s;
      ear.scale.setScalar(earS);
      const outer = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.11, 4), M.ears);
      outer.position.y = 0.05;
      outer.rotation.y = Math.PI / 4;
      outer.scale.z = 0.55;
      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.075, 4), mInner);
      inner.position.set(0, 0.04, 0.018);
      inner.rotation.y = Math.PI / 4;
      inner.scale.z = 0.3;
      ear.add(outer, inner);
      if (build.tufts) {
        const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.06, 5), M.ears);
        tuft.position.y = 0.13;
        ear.add(tuft);
      }
      this.head.add(ear);
      this.ears.push(ear);
    }

    // mouth + tongue
    this.mouth = sphere(1, std('#5a1520'), 0.03, 0.004, 0.02);
    this.mouth.position.set(0, -0.012, 0.19);
    this.tongue = sphere(1, std('#ff7f9a'), 0.022, 0.006, 0.035);
    this.tongue.position.set(0, -0.022, 0.2);
    this.tongue.visible = false;
    this.head.add(this.mouth, this.tongue);

    // whiskers
    const wPts = [];
    for (const s of [1, -1])
      for (let i = 0; i < 3; i++) {
        wPts.push(0.05 * s, 0.015, 0.2, 0.2 * s, 0.035 - i * 0.025, 0.17 - i * 0.01);
      }
    const wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.Float32BufferAttribute(wPts, 3));
    this.head.add(new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: '#ffffff' })));

    this.hatAnchor = new THREE.Group();
    this.hatAnchor.position.set(0, 0.18, 0.055);
    this.head.add(this.hatAnchor);
    this.hat = null;
    this.hatId = 'none';

    // legs: pivot at shoulder/hip
    this.legs = {};
    const lx = build.legX ?? 1;
    const legDefs = { FL: [0.085, 0.29, 0.2], FR: [-0.085, 0.29, 0.2], BL: [0.09, 0.3, -0.19], BR: [-0.09, 0.3, -0.19] };
    for (const [k, [x, y, z]] of Object.entries(legDefs)) {
      const g = new THREE.Group();
      g.position.set(x * lx, y, z);
      const inner = new THREE.Group();
      inner.scale.set(lx > 1 ? 1.15 : 1, leg, lx > 1 ? 1.15 : 1);
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.036, 0.2, 10), M.legs);
      upper.position.y = -0.1;
      const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.037, 0.04, 0.08, 10), M.socks);
      sock.position.y = -0.23;
      const paw = sphere(0.046, M.paws, 1, 0.65, 1.35);
      paw.position.set(0, -0.272, 0.015);
      inner.add(upper, sock, paw);
      g.add(inner);
      this.body.add(g);
      this.legs[k] = g;
    }

    // tail: chain of segments
    this.tail = [];
    let parent = new THREE.Group();
    parent.position.set(0, 0.36, -0.3);
    this.body.add(parent);
    this.tailBase = parent;
    const N = 8, tailR = build.tailR ?? 1, segLen = 0.075 * (build.tailLen ?? 1);
    for (let i = 0; i < N; i++) {
      const seg = new THREE.Group();
      if (i > 0) seg.position.y = segLen;
      const r = (0.034 - i * 0.0018) * tailR;
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, segLen * 0.8, 4, 8), M.tail);
      m.position.y = segLen / 2;
      seg.add(m);
      parent.add(seg);
      this.tail.push(seg);
      parent = seg;
    }

    // animation state
    this.t = Math.random() * 10;
    this.walkPhase = 0;
    this.swatT = 0;
    this.meowT = 0;
    this.hurtT = 0;
    this.lickT = 0;
    this.nextLick = 3 + Math.random() * 3;
    this.sleep = 0; // 0..1 blend
    this.nyan = false;
  }

  setHat(id) {
    if (this.hat) this.hatAnchor.remove(this.hat);
    this.hat = buildHat(id);
    this.hatId = id;
    if (this.hat) this.hatAnchor.add(this.hat);
  }

  setNyan(on) {
    this.nyan = on;
    this.popTart.visible = on;
    this.torso.visible = !on;
  }

  swat() { this.swatT = 0.32; }
  meow() { this.meowT = 0.6; }
  hurt() { this.hurtT = 0.35; }
  startLick() { if (this.lickT <= 0) this.lickT = 2.6; }

  // s: { speed, grounded, vy, idle (bool), sleeping (bool) }
  update(dt, s = {}) {
    this.t += dt;
    const t = this.t;
    const speed = s.speed || 0;
    const grounded = s.grounded !== false;
    const L = this.legs;

    // reset pose
    for (const k in L) { L[k].rotation.set(0, 0, 0); }
    this.head.rotation.set(0, 0, 0);
    this.body.position.set(0, this.baseY, 0);
    this.body.rotation.set(0, 0, 0);

    // idle licking timer
    if (s.idle && !s.sleeping && !this.nyan) {
      this.nextLick -= dt;
      if (this.nextLick <= 0) { this.startLick(); this.nextLick = 5 + Math.random() * 6; }
    } else if (!s.idle) {
      this.lickT = 0;
    }

    this.sleep += ((s.sleeping ? 1 : 0) - this.sleep) * Math.min(1, dt * 3);

    if (this.nyan) {
      // flying pop tart: legs paddle, body bobs
      const p = t * 18;
      L.FL.rotation.x = Math.sin(p) * 0.7 - 0.4;
      L.FR.rotation.x = Math.sin(p + Math.PI) * 0.7 - 0.4;
      L.BL.rotation.x = Math.sin(p + Math.PI) * 0.7 + 0.4;
      L.BR.rotation.x = Math.sin(p) * 0.7 + 0.4;
      this.body.position.y = this.baseY + Math.sin(t * 12) * 0.03;
      this.head.rotation.z = Math.sin(t * 6) * 0.15;
    } else if (!grounded) {
      const up = THREE.MathUtils.clamp((s.vy || 0) / 6, -1, 1);
      L.FL.rotation.x = L.FR.rotation.x = -0.7 - up * 0.3;
      L.BL.rotation.x = L.BR.rotation.x = 0.8 + up * 0.2;
      this.body.rotation.x = -up * 0.25;
    } else if (speed > 0.15) {
      this.walkPhase += dt * (4 + speed * 2.6);
      const p = this.walkPhase, a = Math.min(1, speed / 3) * 0.75;
      L.FL.rotation.x = Math.sin(p) * a;
      L.BR.rotation.x = Math.sin(p) * a;
      L.FR.rotation.x = Math.sin(p + Math.PI) * a;
      L.BL.rotation.x = Math.sin(p + Math.PI) * a;
      this.body.position.y = this.baseY + Math.abs(Math.sin(p)) * 0.025;
      this.head.rotation.x = Math.sin(p * 2) * 0.04;
    } else {
      // breathing
      this.body.position.y = this.baseY + Math.sin(t * 2) * 0.004;
    }

    // lick: raise front-left paw, head down to it, tongue flicks
    if (this.lickT > 0) {
      this.lickT -= dt;
      const k = Math.min(1, Math.min(2.6 - this.lickT, this.lickT) * 4);
      L.FL.rotation.x = -1.55 * k;
      L.FL.rotation.z = -0.35 * k;
      this.head.rotation.x = 0.45 * k;
      this.head.rotation.y = 0.45 * k;
      const lick = Math.max(0, Math.sin(t * 9));
      this.tongue.visible = k > 0.5;
      this.tongue.scale.set(0.022, 0.006, 0.03 + lick * 0.03);
      this.tongue.position.z = 0.2 + lick * 0.02;
      this.eyes.forEach((e) => (e.scale.y = 0.35));
    } else {
      this.tongue.visible = false;
      this.eyes.forEach((e) => (e.scale.y = 1));
    }

    // blink
    if (Math.sin(t * 0.9) > 0.995) this.eyes.forEach((e) => (e.scale.y = 0.1));

    // swat (front right paw)
    if (this.swatT > 0) {
      this.swatT -= dt;
      const k = Math.sin((1 - this.swatT / 0.32) * Math.PI);
      L.FR.rotation.x = -2.1 * k;
      L.FR.rotation.z = 0.4 * k;
      this.body.rotation.x = -0.15 * k;
      this.head.rotation.y = -0.15 * k;
    }

    // meow
    let mouthOpen = 0;
    if (this.meowT > 0) {
      this.meowT -= dt;
      mouthOpen = Math.sin((1 - this.meowT / 0.6) * Math.PI);
      this.head.rotation.x -= 0.35 * mouthOpen;
    }
    if (this.nyan) mouthOpen = Math.max(mouthOpen, 0.6 + Math.sin(t * 20) * 0.3);
    this.mouth.scale.y = 0.004 + mouthOpen * 0.03;

    // ears: flatten when hurt
    const flat = this.hurtT > 0 ? 1 : 0;
    this.ears[0].rotation.z = -0.32 - flat * 0.8 + Math.sin(t * 3.1) * 0.03;
    this.ears[1].rotation.z = 0.32 + flat * 0.8;
    if (Math.sin(t * 0.7) > 0.98) this.ears[1].rotation.x = 0.4; // twitch

    // hurt flash
    if (this.hurtT > 0) {
      this.hurtT -= dt;
      const f = Math.max(0, this.hurtT / 0.35);
      for (const m of this.flashMats) m.emissive.setRGB(0.8 * f, 0, 0);
    } else {
      for (const m of this.flashMats) m.emissive.setRGB(0, 0, 0);
    }

    // tail sway (question-mark tail, swishes faster when moving)
    const swish = speed > 0.2 ? 5 : 1.8;
    for (let i = 0; i < this.tail.length; i++) {
      const seg = this.tail[i];
      seg.rotation.x = i === 0 ? -1.15 + Math.sin(t * 1.3) * 0.05 : 0.17 + (i > 5 ? 0.25 : 0);
      seg.rotation.z = Math.sin(t * swish - i * 0.5) * (0.12 + i * 0.03);
    }

    // sleeping curl overrides
    if (this.sleep > 0.01) {
      const k = this.sleep;
      this.body.position.y -= 0.13 * k;
      for (const leg of ['FL', 'FR']) L[leg].rotation.x = THREE.MathUtils.lerp(L[leg].rotation.x, -1.45, k);
      for (const leg of ['BL', 'BR']) L[leg].rotation.x = THREE.MathUtils.lerp(L[leg].rotation.x, 1.45, k);
      this.head.rotation.x = THREE.MathUtils.lerp(this.head.rotation.x, 0.5, k);
      this.head.rotation.y = THREE.MathUtils.lerp(this.head.rotation.y, 0.7, k);
      this.head.position.y = this.headY - 0.05 * k;
      this.eyes.forEach((e) => (e.scale.y = THREE.MathUtils.lerp(e.scale.y, 0.08, k)));
      for (let i = 0; i < this.tail.length; i++) {
        this.tail[i].rotation.x = THREE.MathUtils.lerp(this.tail[i].rotation.x, i === 0 ? -1.5 : 0.05, k);
        this.tail[i].rotation.z = THREE.MathUtils.lerp(this.tail[i].rotation.z, 0.38, k);
      }
    } else {
      this.head.position.y = this.headY;
    }

    if (this.hat && this.hat.userData.animate) this.hat.userData.animate(dt, speed);
  }
}