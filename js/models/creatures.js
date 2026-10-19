// Low-poly creature + prop models. Local +Z is forward, feet at y = 0.
import * as THREE from 'three';

const mats = new Map();
function m(color, extra) {
  const key = color + (extra ? JSON.stringify(extra) : '');
  if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...extra }));
  return mats.get(key);
}
function sph(r, mat, x, y, z, sx = 1, sy = 1, sz = 1, seg = 14) {
  const o = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(6, seg - 4)), mat);
  o.position.set(x, y, z);
  o.scale.set(sx, sy, sz);
  return o;
}
function cyl(rt, rb, h, mat, x, y, z, seg = 10) {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  o.position.set(x, y, z);
  return o;
}

// ------------------------------------------------------------------ RAT / MOUSE
export function makeRat(variant = 'rat') {
  const mouse = variant === 'mouse';
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const fur = new THREE.MeshStandardMaterial({ color: mouse ? '#a08c76' : '#7d7470', roughness: 0.9 });
  const pink = m('#e6a1a8');
  body.add(sph(1, fur, 0, 0.09, 0, 0.085, 0.075, 0.16));
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 10), fur);
  head.rotation.x = Math.PI / 2;
  head.position.set(0, 0.09, 0.2);
  body.add(head);
  body.add(sph(0.015, pink, 0, 0.09, 0.27));
  for (const s of [1, -1]) {
    const ear = sph(mouse ? 0.05 : 0.032, pink, (mouse ? 0.05 : 0.04) * s, mouse ? 0.15 : 0.14, 0.15, 1, 1, 0.3);
    body.add(ear);
    body.add(sph(0.011, m(mouse ? '#111111' : '#c0102a', { emissive: mouse ? '#000000' : '#600010' }), 0.032 * s, 0.11, 0.2));
  }
  const tail = new THREE.Group();
  tail.position.set(0, 0.07, -0.15);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.03, -0.03, -0.1), new THREE.Vector3(-0.03, -0.05, -0.2), new THREE.Vector3(0.02, -0.06, -0.3),
  ]);
  tail.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.009, 5), pink));
  body.add(tail);
  const legs = [];
  for (const [x, z] of [[0.06, 0.09], [-0.06, 0.09], [0.06, -0.08], [-0.06, -0.08]]) {
    const l = cyl(0.014, 0.014, 0.05, pink, x, 0.025, z, 6);
    body.add(l);
    legs.push(l);
  }
  if (mouse) root.scale.setScalar(0.62);
  let t = Math.random() * 10;
  return {
    root, body, fur,
    update(dt, speed, extra = {}) {
      t += dt * (speed > 0.1 ? 1 : 0.3);
      body.position.y = speed > 0.1 ? Math.abs(Math.sin(t * 22)) * 0.02 : 0;
      tail.rotation.y = Math.sin(t * (speed > 0.1 ? 20 : 4)) * 0.4;
      legs.forEach((l, i) => (l.position.y = 0.025 + (speed > 0.1 ? Math.sin(t * 22 + i * Math.PI) * 0.012 : 0)));
      body.rotation.x = extra.biting ? -0.4 : 0;
    },
  };
}

// ------------------------------------------------------------------ BIRDS
// variant 'magpie' (black & white), 'pigeon' (grey, green neck sheen) or 'budgie'
// (tiny; green & yellow or blue & white)
const BIRD_LOOKS = {
  magpie: { body: '#141418', belly: '#f2f2f2', head: '#141418', patch: '#f2f2f2', beak: '#d9d4c7', eye: '#a0301a', size: 1 },
  pigeon: { body: '#8e939c', belly: '#a9aeb6', head: '#6d727b', patch: '#4a4e55', beak: '#2b2b2b', eye: '#e07b2a', neck: '#4f9a83', size: 1.1 },
  budgieGreen: { body: '#6cc63a', belly: '#a8e05a', head: '#ffe14d', patch: '#2f5f1c', beak: '#e8c07a', eye: '#111111', size: 0.62 },
  budgieBlue: { body: '#3a86ff', belly: '#8ec5ff', head: '#ffffff', patch: '#1d3f80', beak: '#e8c07a', eye: '#111111', size: 0.62 },
};

export function makeMagpie(variant = 'magpie') {
  const look = variant === 'budgie' ? (Math.random() < 0.5 ? BIRD_LOOKS.budgieGreen : BIRD_LOOKS.budgieBlue) : BIRD_LOOKS[variant] || BIRD_LOOKS.magpie;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const black = new THREE.MeshStandardMaterial({ color: look.body, roughness: 0.4, metalness: 0.1 });
  const white = m(look.patch);
  const plump = variant === 'pigeon' ? 0.085 : 0.075;
  body.add(sph(1, black, 0, 0, 0, plump, plump, 0.16));
  body.add(sph(1, m(look.belly), 0, -0.01, -0.04, 0.07, 0.06, 0.1));
  body.add(sph(0.065, m(look.head), 0, 0.06, 0.15));
  if (look.neck) body.add(sph(1, m(look.neck, { metalness: 0.4, roughness: 0.3 }), 0, 0.02, 0.11, 0.07, 0.05, 0.05));
  const small = variant !== 'magpie';
  const beak = new THREE.Mesh(new THREE.ConeGeometry(small ? 0.016 : 0.022, small ? 0.05 : 0.09, 8), m(look.beak));
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.05, small ? 0.225 : 0.25);
  body.add(beak);
  for (const s of [1, -1]) body.add(sph(0.012, m(look.eye, { emissive: '#301008' }), 0.04 * s, 0.08, 0.2));
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.012, variant === 'budgie' ? 0.26 : 0.16), black);
  tail.position.set(0, 0.01, variant === 'budgie' ? -0.25 : -0.2);
  body.add(tail);
  const wings = [];
  for (const s of [1, -1]) {
    const pivot = new THREE.Group();
    pivot.position.set(0.06 * s, 0.03, 0.02);
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.012, 0.15), black);
    w.position.x = 0.13 * s;
    const patch = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.014, 0.1), white);
    patch.position.x = 0.07 * s;
    pivot.add(w, patch);
    body.add(pivot);
    wings.push({ pivot, s });
  }
  root.scale.setScalar(look.size);
  let t = Math.random() * 10;
  return {
    root, body, black,
    update(dt, flapRate = 12, dive = 0) {
      t += dt;
      const a = dive > 0.5 ? 0.15 : Math.sin(t * flapRate) * 0.75;
      for (const { pivot, s } of wings) pivot.rotation.z = (dive > 0.5 ? 0.6 : a) * s;
      body.rotation.x = dive * 0.6;
    },
  };
}

// ------------------------------------------------------------------ DOG
// coat: { main, dark, light } colours (defaults: Brutus the brown boxer)
export function makeDog(colors = {}) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const coat = m(colors.main || '#7a4a26');
  const dark = m(colors.dark || '#3b2414');
  const tan = m(colors.light || '#c08a55');
  body.add(sph(1, coat, 0, 0.58, 0, 0.24, 0.24, 0.5));
  body.add(sph(1, tan, 0, 0.52, 0.28, 0.18, 0.2, 0.18));
  const head = new THREE.Group();
  head.position.set(0, 0.8, 0.5);
  body.add(head);
  head.add(sph(0.17, coat, 0, 0.04, 0));
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.11, 0.18), tan);
  snout.position.set(0, -0.02, 0.18);
  head.add(snout);
  head.add(sph(0.035, m('#111', { roughness: 0.3 }), 0, 0.03, 0.27));
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.04, 0.16), dark);
  jaw.position.set(0, -0.08, 0.16);
  head.add(jaw);
  const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.01, 0.1), m('#e05a7a'));
  tongue.position.set(0, -0.065, 0.2);
  head.add(tongue);
  const eyes = [];
  for (const s of [1, -1]) {
    const e = sph(0.025, m('#111', { roughness: 0.2 }), 0.075 * s, 0.1, 0.13);
    head.add(e);
    eyes.push(e);
    const brow = sph(0.03, tan, 0.075 * s, 0.14, 0.11, 1, 0.5, 0.6);
    head.add(brow);
    const ear = sph(0.09, dark, 0.15 * s, 0.05, -0.02, 0.35, 1, 0.7);
    ear.rotation.z = 0.3 * s;
    head.add(ear);
  }
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.025, 8, 20), m('#c0392b'));
  collar.position.set(0, 0.7, 0.4);
  collar.rotation.x = Math.PI / 2 - 0.5;
  body.add(collar);
  body.add(sph(0.03, m('#ffcc33', { metalness: 0.8, roughness: 0.2 }), 0, 0.58, 0.52));
  const legs = [];
  for (const [x, z] of [[0.13, 0.32], [-0.13, 0.32], [0.13, -0.32], [-0.13, -0.32]]) {
    const g = new THREE.Group();
    g.position.set(x, 0.5, z);
    g.add(cyl(0.06, 0.05, 0.46, coat, 0, -0.23, 0));
    g.add(sph(0.065, tan, 0, -0.47, 0.03, 1, 0.6, 1.3));
    body.add(g);
    legs.push(g);
  }
  const tail = new THREE.Group();
  tail.position.set(0, 0.68, -0.48);
  const tm = cyl(0.03, 0.02, 0.32, coat, 0, 0.16, 0);
  tail.add(tm);
  tail.rotation.x = -0.6;
  body.add(tail);
  let t = 0, phase = 0;
  return {
    root, head, jaw, eyes,
    update(dt, speed, state = {}) {
      t += dt;
      phase += dt * (3 + speed * 2.2);
      const a = Math.min(1, speed / 2) * 0.55;
      legs[0].rotation.x = Math.sin(phase) * a;
      legs[3].rotation.x = Math.sin(phase) * a;
      legs[1].rotation.x = Math.sin(phase + Math.PI) * a;
      legs[2].rotation.x = Math.sin(phase + Math.PI) * a;
      body.position.y = speed > 0.2 ? Math.abs(Math.sin(phase)) * 0.04 : 0;
      tail.rotation.z = Math.sin(t * (state.happy ? 18 : 5)) * (state.happy ? 0.7 : 0.25);
      const bark = state.barkT > 0 ? Math.abs(Math.sin(state.barkT * 20)) : 0;
      jaw.rotation.x = bark * 0.5 + (state.chasing ? 0.15 : 0);
      tongue.visible = state.chasing || state.happy;
      head.rotation.y = state.lookYaw || 0;
      head.rotation.x = state.sleeping ? 0.5 : 0;
      body.position.y -= state.sleeping ? 0.3 : 0;
      for (const e of eyes) e.scale.y = state.sleeping ? 0.15 : 1;
      if (state.sleeping) for (const l of legs) l.rotation.x = l.position.z > 0 ? -1.3 : 1.3;
    },
  };
}

// ------------------------------------------------------------------ HUMAN
export function makeHuman({ shirt = '#d1495b', hair = '#5a3825', skin = '#f1c27d', pants = '#34495e', pose = 'stand', seat, noSeat } = {}) {
  const root = new THREE.Group();
  const skinM = m(skin), shirtM = m(shirt), hairM = m(hair), pantsM = m(pants);
  const sitting = pose === 'sit';
  const hipY = sitting ? 0.48 : 0.9;
  const legs = new THREE.Group();
  root.add(legs);
  for (const s of [1, -1]) {
    if (sitting) {
      const thigh = cyl(0.075, 0.07, 0.44, pantsM, 0.1 * s, hipY, 0.2);
      thigh.rotation.x = Math.PI / 2;
      const shin = cyl(0.065, 0.06, 0.46, pantsM, 0.1 * s, 0.24, 0.41);
      legs.add(thigh, shin, sph(0.07, m('#222'), 0.1 * s, 0.03, 0.47, 1, 0.6, 1.5));
    } else {
      legs.add(cyl(0.08, 0.07, 0.86, pantsM, 0.1 * s, 0.45, 0), sph(0.07, m('#222'), 0.1 * s, 0.03, 0.06, 1, 0.6, 1.5));
    }
  }
  if (sitting && !noSeat) {
    const chair = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.5), m(seat || '#333'));
    chair.position.set(0, hipY - 0.08, 0.05);
    root.add(chair);
    root.add(cyl(0.03, 0.03, hipY - 0.1, m('#555'), 0, (hipY - 0.1) / 2, 0.05, 6));
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.5, 0.05), m(seat || '#333'));
    back.position.set(0, hipY + 0.3, -0.25);
    root.add(back);
  }
  const torso = new THREE.Group();
  torso.position.y = hipY;
  root.add(torso);
  const chest = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.32, 4, 12), shirtM);
  chest.position.y = 0.33;
  chest.scale.z = 0.65;
  torso.add(chest);
  const head = new THREE.Group();
  head.position.y = 0.78;
  torso.add(head);
  head.add(sph(0.12, skinM, 0, 0, 0, 1, 1.1, 1));
  const hairTop = new THREE.Mesh(new THREE.SphereGeometry(0.128, 16, 10, 0, Math.PI * 2, 0, Math.PI / 1.9), hairM);
  hairTop.position.y = 0.02;
  hairTop.rotation.x = -0.25;
  head.add(hairTop);
  for (const s of [1, -1]) head.add(sph(0.016, m('#222'), 0.045 * s, 0.02, 0.105));
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.007, 6, 12, Math.PI), m('#8a3a3a'));
  smile.position.set(0, -0.04, 0.108);
  smile.rotation.z = Math.PI;
  head.add(smile);
  const arms = [];
  for (const s of [1, -1]) {
    const pivot = new THREE.Group();
    pivot.position.set(0.22 * s, 0.55, 0);
    pivot.add(cyl(0.055, 0.05, 0.5, shirtM, 0, -0.25, 0));
    pivot.add(sph(0.055, skinM, 0, -0.52, 0));
    pivot.rotation.z = 0.12 * s;
    if (sitting) pivot.rotation.x = -0.7;
    torso.add(pivot);
    arms.push(pivot);
  }
  let t = Math.random() * 10;
  let waveT = 0, tossT = 0;
  return {
    root, head, height: sitting ? 1.4 : 1.8,
    wave() { waveT = 1.6; },
    toss() { tossT = 0.7; },
    update(dt, lookYaw = 0) {
      t += dt;
      chest.scale.x = 1 + Math.sin(t * 1.8) * 0.015;
      head.rotation.y = lookYaw;
      arms[0].rotation.x = sitting ? -0.7 : 0;
      arms[0].rotation.z = 0.12;
      if (waveT > 0) {
        waveT -= dt;
        arms[0].rotation.z = 2.6 + Math.sin(t * 14) * 0.3;
      }
      if (tossT > 0) {
        tossT -= dt;
        arms[1].rotation.x = -2.2 * Math.sin((1 - tossT / 0.7) * Math.PI);
      } else {
        arms[1].rotation.x = sitting ? -0.7 : 0;
      }
    },
  };
}

// ------------------------------------------------------------------ PICKUPS
export function makeFish() {
  const g = new THREE.Group();
  const scale = m('#f28c28', { metalness: 0.3, roughness: 0.35 });
  g.add(sph(1, scale, 0, 0, 0, 0.05, 0.09, 0.17));
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.1, 4), scale);
  tail.rotation.x = -Math.PI / 2;
  tail.position.z = -0.19;
  tail.scale.x = 0.3;
  g.add(tail);
  for (const s of [1, -1]) g.add(sph(0.016, m('#111'), 0.04 * s, 0.03, 0.11));
  return g;
}

export function makeDuck(scale = 1) {
  const g = new THREE.Group();
  const yellow = m('#ffd60a', { roughness: 0.35 });
  g.add(sph(1, yellow, 0, 0.06, 0, 0.09, 0.07, 0.11));
  g.add(sph(0.06, yellow, 0, 0.15, 0.06));
  const beak = sph(1, m('#ff7b00', { roughness: 0.4 }), 0, 0.14, 0.12, 0.035, 0.015, 0.035);
  g.add(beak);
  for (const s of [1, -1]) g.add(sph(0.011, m('#111'), 0.03 * s, 0.17, 0.1));
  const tail = sph(1, yellow, 0, 0.1, -0.1, 0.03, 0.04, 0.03);
  g.add(tail);
  g.scale.setScalar(scale);
  return g;
}

// Soft dark blob under characters (cheap fake shadow).
const blobTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const gr = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(0,0,0,0.55)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();
export function makeBlob(r) {
  const o = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));
  o.rotation.x = -Math.PI / 2;
  o.renderOrder = 1;
  return o;
}