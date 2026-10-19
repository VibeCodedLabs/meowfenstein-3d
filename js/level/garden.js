// Level 2: The Garden. Back deck, lawn, veggie patch, play area and shed corner.
import * as THREE from 'three';
import { Builder, mat } from './builder.js';
import * as TX from '../textures.js';

// Tile legend:
//   b  house brick wall   w  house window   D  back door
//   #  hedge              f  paling fence
//   P  back deck   L  back lawn   S  side path   V  veggie patch
//   C  shed corner Y  play area
export const GARDEN_MAP = [
  'bbbbwwbbbbwwbbbDDbbbwwbbbwwbbbbwwbbbbb',
  '#SSSfLLLPPPPPPPPPPPPPPPLLLLLLfVVVVVVV#',
  '#SSSfLLLPPPPPPPPPPPPPPPLLLLLLfVVVVVVV#',
  '#SSSfLLLPPPPPPPPPPPPPPPLLLLLLfVVVVVVV#',
  '#SSSfLLLPPPPPPPPPPPPPPPLLLLLLfVVVVVVV#',
  '#SSSfLLLPPPPPPPPPPPPPPPLLLLLLfVVVVVVV#',
  '#SSSfLLLPPPPPPPPPPPPPPPLLLLLLfVVVVVVV#',
  '#SSSfLLLLLLLLLLLLLLLLLLLLLLLLVVVVVVVV#',
  '#SSSfLLLLLLLLLLLLLLLLLLLLLLLLVVVVVVVV#',
  '#SSSfLLLLLLLLLLLLLLLLLLLLLLLLfVVVVVVV#',
  '#SSSSLLLLLLLLLLLLLLLLLLLLLLLLfVVVVVVV#',
  '#SSSSLLLLLLLLLLLLLLLLLLLLLLLLfVVVVVVV#',
  '#SSSfLLLLLLLLLLLLLLLLLLLLLLLLfVVVVVVV#',
  '#SSSfLLLLLLLLLLLLLLLLLLLLLLLLfVVVVVVV#',
  '#SSSfLLLLLLLLLLLLLLLLLLLLLLLLfVVVVVVV#',
  '#SSSfLLLLLLLLLLLLLLLLLLLLLLLLffffCCff#',
  '#SSSfLLLLLLLLLLLLLLLLLLLLLLLLCCCCCCCC#',
  '#SSSfLLLLLLLLLLLLLLLLLLLLLLLLCCCCCCCC#',
  '#SSSfLLLLLLLLLLLLLLLLLLLLLLLLCCCCCCCC#',
  '#SSSfLLLLLLLLLLLLLLLLLLLLLLLLCCCCCCCC#',
  '#SSSfLLLLLLLLLLLLLLLLLLLLLLLLCCCCCCCC#',
  '#SSSfLLLLLLLLLLLLLLLLLLLLLLLLCCCCCCCC#',
  '#SSSfLLLLLLLLLLLLLLLLLLLLLLLLCCCCCCCC#',
  '#SSSfYYYYYYYYYYLLLLLLLLLLLLLLCCCCCCCC#',
  '#SSSfYYYYYYYYYYLLLLLLLLLLLLLLCCCCCCCC#',
  '#SSSSYYYYYYYYYYLLLLLLLLLLLLLLCCCCCCCC#',
  '#SSSfYYYYYYYYYYLLLLLLLLLLLLLLCCCCCCCC#',
  '#SSSfYYYYYYYYYYLLLLLLLLLLLLLLCCCCCCCC#',
  '#SSSfYYYYYYYYYYLLLLLLLLLLLLLLCCCCCCCC#',
  '######################################',
];

export const GARDEN_ROOMS = {
  P: { name: 'Back Deck', floor: 'decking', floorColor: '#9b7653' },
  L: { name: 'Back Lawn', floor: 'grass', floorColor: '#5f9e3d' },
  S: { name: 'Side Path', floor: 'gravel', floorColor: '#b9ad9a' },
  V: { name: 'Veggie Patch', floor: 'grass', floorColor: '#6a9a3e' },
  C: { name: 'Shed Corner', floor: 'grass', floorColor: '#6f8f3a' },
  Y: { name: 'Play Area', floor: 'bark', floorColor: '#8a5a35' },
};

export const GARDEN = {
  id: 'garden',
  number: 2,
  name: 'The Garden',
  map: GARDEN_MAP,
  walls: 'bwD#f',
  rooms: GARDEN_ROOMS,
  wallStyles: {
    b: { kind: 'brick', h: 3.2, cap: '#8c8c8c' },
    w: { kind: 'brickWindow', h: 3.2, cap: '#8c8c8c' },
    D: { kind: 'door', h: 3.2, cap: '#8c8c8c' },
    '#': { kind: 'hedge', h: 1.7, cap: '#3f7a35' },
    f: { kind: 'fence', h: 1.5, cap: '#7d5a3a' },
  },
  windowChars: 'w',
  ceiling: false,
  timeLimit: 420,
  camMaxY: 5,
  flyMaxY: 6,
  attract: { cx: 15.5, cz: 11, rx: 6, rz: 4.5, y: 2.4, look: [15.8, 0.5, 6], cat: [15.9, 5.2] },
  intro: 'Magpie season! Clear the garden of rats and magpies, then find a sunny nap spot.',
  cleared: 'The garden is pest-free! Nap on the sun lounger on the lawn, or up on the warm shed roof.',
  clearedText: 'cleared the garden',
  build: buildGarden,
};

// ---------------------------------------------------------------- props
// Rectangular hip roof: a 4-sided pyramid scaled to w x d (scaling happens after the 45deg turn).
function hipRoof(b, x, z, w, d, baseY, h, color) {
  const g = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.ConeGeometry(Math.SQRT1_2, h, 4, 1), mat(color));
  cone.rotation.y = Math.PI / 4;
  cone.position.y = h / 2;
  g.add(cone);
  g.position.set(x, baseY, z);
  g.scale.set(w, 1, d);
  b.root.add(g);
  return g;
}

function tree(b, x, z, trunkH, canopy, colors) {
  b.cyl(x, z, 0.28, 0.42, 0, trunkH, '#b8a790');
  const leaf = colors.map((c) => mat(c));
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2, r = i === 0 ? 0 : canopy * 0.55;
    const m = b.deco(new THREE.SphereGeometry(canopy * (0.55 + Math.random() * 0.25), 10, 8), leaf[i % leaf.length],
      x + Math.cos(a) * r, trunkH + 0.6 + Math.random() * 0.9, z + Math.sin(a) * r);
    m.scale.y = 0.7;
  }
}

function gnome(b, x, z, hat = '#d62839') {
  b.cyl(x, z, 0.1, 0.13, 0, 0.22, '#3f6fb5');
  b.deco(new THREE.SphereGeometry(0.08, 10, 8), mat('#f1c27d'), x, 0.28, z);
  b.deco(new THREE.SphereGeometry(0.075, 10, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat('#ffffff'), x, 0.26, z + 0.03);
  b.deco(new THREE.ConeGeometry(0.085, 0.2, 10), mat(hat), x, 0.42, z);
  b.physics.addBox(x - 0.13, x + 0.13, z - 0.13, z + 0.13, 0, 0.42);
}

function raisedBed(b, x0, x1, z0, z1, plants) {
  b.box(x0, x1, z0, z1, 0, 0.4, '#8a6440');
  b.vbox(x0 + 0.08, x1 - 0.08, z0 + 0.08, z1 - 0.08, 0.4, 0.405, mat('#4a3324'));
  const g = mat('#3f8f3a');
  for (let x = x0 + 0.35; x < x1 - 0.2; x += 0.55)
    for (let z = z0 + 0.35; z < z1 - 0.2; z += 0.6) {
      const m = b.deco(new THREE.SphereGeometry(0.17, 8, 6), g, x, 0.52, z);
      m.scale.y = 0.8;
      if (plants === 'tomato' && Math.random() < 0.6) b.deco(new THREE.SphereGeometry(0.05, 8, 6), mat('#e63946'), x + 0.1, 0.55, z + 0.08);
      if (plants === 'pumpkin' && Math.random() < 0.3) b.deco(new THREE.SphereGeometry(0.12, 10, 8), mat('#f4a261'), x, 0.5, z + 0.15);
    }
}

function wheelieBin(b, x0, z0, lid) {
  b.box(x0, x0 + 0.78, z0, z0 + 0.75, 0, 1.0, '#2f5d3a');
  b.box(x0 - 0.02, x0 + 0.8, z0 - 0.02, z0 + 0.77, 1.0, 1.06, lid, { colliderBottom: 0 });
}

export function buildGarden(scene, physics, level) {
  const b = new Builder(scene, physics, level);
  b.buildStructure(GARDEN);

  // ---------- sky + world beyond the hedges ----------
  scene.background = TX.sky();
  scene.fog = new THREE.Fog('#d9edf8', 30, 85);
  const outside = TX.grass('#4f8a35');
  outside.repeat.set(70, 70);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), new THREE.MeshStandardMaterial({ map: outside, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(19, -0.02, 15);
  b.root.add(ground);
  // the family house behind the back wall
  b.vbox(-3, 41, -14, 0, 0, 3.2, mat('#c56f4f'));
  hipRoof(b, 19, -7, 44.6, 14.6, 3.2, 3, '#5b5f66');
  b.vbox(-3, 41, -0.25, 0.05, 3.15, 3.3, mat('#e8e2d6')); // gutter
  // neighbours' roofs and trees peeking over the hedges
  for (const [x, z, w, d, c] of [[-9, 8, 7, 9, '#a85b43'], [-9, 22, 7, 9, '#8e8e8e'], [45, 6, 7, 10, '#7a4b3a'], [45, 22, 7, 10, '#b87652'], [10, 37, 12, 6, '#8d6e63'], [28, 37, 10, 6, '#9e9e9e']]) {
    b.vbox(x - w / 2, x + w / 2, z - d / 2, z + d / 2, 0, 3, mat('#e0d6c8'));
    hipRoof(b, x, z, w + 0.6, d + 0.6, 3, 2.2, c);
  }
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    const x = 19 + Math.cos(a) * (30 + Math.random() * 8), z = 15 + Math.sin(a) * (26 + Math.random() * 8);
    b.deco(new THREE.CylinderGeometry(0.3, 0.45, 4, 6), mat('#8d7b68'), x, 2, z);
    const c = b.deco(new THREE.SphereGeometry(2.4 + Math.random() * 1.5, 8, 6), mat(['#3c6e3a', '#4f7d3b', '#5b8c44'][i % 3]), x, 5 + Math.random(), z);
    c.scale.y = 0.75;
  }

  // ---------- BACK DECK ----------
  b.vbox(15, 17, 1.0, 1.55, 0.004, 0.012, mat('#6b4b35')); // doormat
  b.table(12.0, 14.8, 3.2, 4.6, 0.75, '#6b4b35');
  b.chair(12.7, 2.75, 0, '#6b4b35'); b.chair(14.1, 2.75, 0, '#6b4b35');
  b.chair(12.7, 5.05, Math.PI, '#6b4b35'); b.chair(14.1, 5.05, Math.PI, '#6b4b35');
  const umbrellaPole = b.cyl(13.4, 3.9, 0.025, 0.025, 0.75, 2.3, '#ddd', { collide: false, seg: 6 });
  const umbrella = b.deco(new THREE.ConeGeometry(1.5, 0.45, 8, 1, true), new THREE.MeshStandardMaterial({ color: '#2a9d8f', side: THREE.DoubleSide, roughness: 0.9 }), 13.4, 2.3, 3.9);
  void umbrellaPole; void umbrella;
  b.box(19.4, 21.0, 1.05, 1.75, 0, 0.92, mat('#2b2b2b', { metalness: 0.4, roughness: 0.5 }));
  b.vbox(19.45, 20.95, 1.05, 1.3, 0.92, 1.25, mat('#3a3a3a', { metalness: 0.4, roughness: 0.5 }));
  b.vbox(19.6, 20.8, 1.35, 1.7, 0.925, 0.935, mat('#8b3a1a', { emissive: '#ff5a1a', emissiveIntensity: 0.5 }));
  b.box(17.0, 17.75, 1.1, 1.6, 0, 0.45, mat('#1f6fbf')); // esky
  b.vbox(16.97, 17.78, 1.07, 1.63, 0.45, 0.5, mat('#ffffff'));
  b.plant(8.6, 1.6, '#b5651d');
  b.plant(22.4, 6.4, '#3f6fb5', 0.9);
  b.plant(22.4, 1.6, '#b5651d', 1.1);
  b.vbox(8, 23, 6.9, 7.0, 0, 0.06, mat('#7a5a3e')); // deck edge board

  // ---------- BACK LAWN ----------
  tree(b, 10.5, 13.0, 4.0, 2.2, ['#5b7f3a', '#6b8f45', '#4d6e33']);
  tree(b, 24.5, 19.5, 3.2, 1.9, ['#9b7fd1', '#b39ddb', '#8a6cc4']);
  // sun lounger (nap spot)
  b.box(19.6, 21.8, 10.0, 10.7, 0, 0.36, mat('#e9e4da'));
  b.box(19.6, 21.8, 10.02, 10.68, 0.36, 0.42, mat('#f4a261'), { colliderBottom: 0 });
  const back = b.deco(new THREE.BoxGeometry(0.7, 0.06, 0.7), mat('#f4a261'), 21.75, 0.62, 10.35, Math.PI / 2);
  back.rotation.z = 0.9;
  b.box(5.1, 6.4, 13.0, 18.0, 0, 0.35, '#8a6440'); // flower bed
  for (let z = 13.3; z < 17.9; z += 0.45) {
    b.deco(new THREE.SphereGeometry(0.14, 8, 6), mat('#3f8f3a'), 5.75, 0.45, z);
    b.deco(new THREE.SphereGeometry(0.06, 8, 6), mat(['#ff6b9a', '#ffd166', '#c77dff', '#ffffff'][Math.floor(z * 3) % 4]), 5.7, 0.58, z + 0.1);
  }
  // fish pond (wet!)
  const pondRim = b.deco(new THREE.TorusGeometry(1.15, 0.2, 8, 24), mat('#8d8d86'), 24.5, 0.05, 12.5);
  pondRim.rotation.x = Math.PI / 2;
  pondRim.scale.set(1, 0.8, 1);
  const water = b.deco(new THREE.CircleGeometry(1.1, 24), new THREE.MeshStandardMaterial({ color: '#3d8fb0', roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.85 }), 24.5, 0.03, 12.5);
  water.rotation.x = -Math.PI / 2;
  physics.addBox(23.6, 25.4, 11.6, 13.4, 0, 0.0, 'water');
  for (const [dx, dz] of [[0.4, 0.2], [-0.3, -0.4], [0.1, -0.1]]) b.deco(new THREE.SphereGeometry(0.06, 8, 6), mat('#ff8c42'), 24.5 + dx, 0.06, 12.5 + dz).scale.set(1, 0.5, 2); // goldfish
  b.box(16.0, 18.0, 16.6, 17.0, 0, 0.3, '#7a5233'); // log
  gnome(b, 7.5, 9.0); gnome(b, 27.5, 8.5, '#2a9d8f'); gnome(b, 13.5, 21.0, '#f4a261'); gnome(b, 27.0, 22.5);
  b.box(26.1, 26.8, 15.0, 16.1, 0, 0.55, mat('#c0392b')); // wheelbarrow
  b.box(6.2, 7.0, 21.0, 21.8, 0, 0.45, mat('#2e7d32')); // lawn mower
  // Hills Hoist rotary clothesline
  b.cyl(22.0, 25.5, 0.05, 0.05, 0, 2.1, '#c0c0c0', { seg: 8 });
  const hoist = new THREE.Group();
  hoist.position.set(22.0, 2.0, 25.5);
  const clothes = ['#e63946', '#f1faee', '#457b9d', '#ffd166', '#06d6a0', '#ff8fab'];
  for (let i = 0; i < 4; i++) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.03, 0.03), mat('#c0c0c0'));
    arm.position.x = 1.1;
    const holder = new THREE.Group();
    holder.rotation.y = (i / 4) * Math.PI * 2;
    holder.add(arm);
    for (let k = 0; k < 2; k++) {
      const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.45, 0.02), mat(clothes[(i * 2 + k) % clothes.length]));
      shirt.position.set(0.8 + k * 0.8, -0.25, 0);
      holder.add(shirt);
    }
    hoist.add(holder);
  }
  b.root.add(hoist);
  // paddling pool (wet!)
  const pool = b.deco(new THREE.TorusGeometry(0.9, 0.15, 8, 24), mat('#4cc9f0'), 17.5, 0.15, 26.5);
  pool.rotation.x = Math.PI / 2;
  const pw = b.deco(new THREE.CircleGeometry(0.85, 24), new THREE.MeshStandardMaterial({ color: '#90e0ef', roughness: 0.1, transparent: true, opacity: 0.85 }), 17.5, 0.08, 26.5);
  pw.rotation.x = -Math.PI / 2;
  physics.addBox(16.85, 18.15, 25.85, 27.15, 0, 0.0, 'water');

  // ---------- PLAY AREA ----------
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    b.cyl(9.0 + Math.cos(a) * 1.5, 26.0 + Math.sin(a) * 1.5, 0.04, 0.04, 0, 0.6, '#555', { collide: false, seg: 6 });
  }
  const tramRing = b.deco(new THREE.TorusGeometry(1.55, 0.08, 8, 32), mat('#1d3557'), 9.0, 0.6, 26.0);
  tramRing.rotation.x = Math.PI / 2;
  const mat2 = b.deco(new THREE.CircleGeometry(1.45, 32), mat('#111'), 9.0, 0.59, 26.0);
  mat2.rotation.x = -Math.PI / 2;
  physics.addBox(7.75, 10.25, 24.75, 27.25, 0, 0.6, 'bouncy');
  // swing set
  for (const [x, z] of [[11.9, 24.5], [11.9, 25.3], [14.6, 24.5], [14.6, 25.3]]) {
    const leg = b.deco(new THREE.CylinderGeometry(0.04, 0.04, 2.1, 6), mat('#e63946'), x, 1.0, z);
    leg.rotation.x = z < 24.9 ? 0.18 : -0.18;
  }
  b.deco(new THREE.CylinderGeometry(0.05, 0.05, 2.9, 8), mat('#e63946'), 13.25, 2.0, 24.9).rotation.z = Math.PI / 2;
  for (const x of [12.7, 13.8]) {
    b.box(x - 0.22, x + 0.22, 24.78, 25.02, 0.42, 0.47, mat('#ffd166'));
    for (const dx of [-0.2, 0.2]) b.deco(new THREE.CylinderGeometry(0.008, 0.008, 1.53, 4), mat('#999'), x + dx, 1.23, 24.9);
  }
  b.box(11.6, 14.6, 27.2, 28.9, 0, 0.12, mat('#f2d49b')); // sandpit
  b.deco(new THREE.SphereGeometry(0.18, 12, 10), mat('#ff006e'), 6.5, 0.18, 27.5); // ball

  // ---------- SIDE PATH ----------
  b.box(1.2, 2.0, 3.0, 3.8, 0, 0.5, mat('#2e7d32')); // hose reel
  b.plant(1.6, 8.0, '#b5651d', 0.8);
  b.plant(3.4, 15.0, '#8a5a3c', 0.9);
  b.plant(1.6, 22.0, '#3f6fb5', 0.8);
  b.box(1.2, 2.4, 17.5, 18.3, 0, 0.3, mat('#a0a0a0')); // paver stack

  // ---------- VEGGIE PATCH ----------
  raisedBed(b, 30.6, 32.6, 2.0, 6.0, 'tomato');
  raisedBed(b, 34.2, 36.6, 2.0, 6.0, 'leafy');
  raisedBed(b, 30.6, 32.6, 9.5, 13.5, 'pumpkin');
  raisedBed(b, 34.2, 36.6, 9.5, 12.0, 'tomato');
  b.cyl(36.3, 14.2, 0.55, 0.55, 0, 1.6, mat('#4f6b52', { metalness: 0.3 })); // water tank
  // scarecrow
  b.cyl(35.5, 7.5, 0.05, 0.05, 0, 1.6, '#8a6440', { seg: 6 });
  b.deco(new THREE.BoxGeometry(1.1, 0.06, 0.06), mat('#8a6440'), 35.5, 1.3, 7.5);
  b.deco(new THREE.BoxGeometry(0.5, 0.5, 0.2), mat('#457b9d'), 35.5, 1.2, 7.5);
  b.deco(new THREE.SphereGeometry(0.15, 10, 8), mat('#e9c46a'), 35.5, 1.62, 7.5);
  b.deco(new THREE.CylinderGeometry(0.25, 0.25, 0.04, 12), mat('#c9a66b'), 35.5, 1.74, 7.5);

  // ---------- SHED CORNER ----------
  b.box(32.6, 36.95, 23.0, 28.95, 0, 2.0, mat('#7d8f69'));
  const shedRoof = b.deco(new THREE.BoxGeometry(4.6, 0.08, 6.2), mat('#b8bcc2', { metalness: 0.5, roughness: 0.45 }), 34.78, 2.05, 25.97);
  shedRoof.rotation.x = 0.03;
  b.vbox(32.58, 32.6, 24.2, 25.8, 0.0, 1.9, mat('#5b6b4a')); // shed door
  wheelieBin(b, 31.78, 24.1, '#2f5d3a');
  wheelieBin(b, 31.78, 25.0, '#c0392b');
  b.cyl(31.3, 24.5, 0.38, 0.44, 0, 0.8, '#2d2d2d'); // compost bin (step up to the bins, then the shed roof)
  // kennel (the dog can't reach a cat on its roof)
  b.box(30.0, 31.4, 18.0, 19.2, 0, 1.05, mat('#a0522d'));
  b.vbox(30.45, 30.95, 19.19, 19.21, 0.05, 0.6, mat('#2b1b12'));
  b.box(29.2, 30.4, 27.6, 28.9, 0, 0.7, mat('#8b5a2b')); // firewood

  // ---------- LIGHTING ----------
  scene.add(new THREE.HemisphereLight('#d6ecff', '#6a8a4a', 1.5));
  const sun = new THREE.DirectionalLight('#fff1d0', 2.4);
  sun.position.set(-15, 30, 25);
  scene.add(sun);

  return {
    update(dt, time, game) {
      hoist.rotation.y += dt * 0.12;
      if (game && Math.random() < dt * 6) {
        game.particles.emit(20.2 + (Math.random() - 0.5) * 0.6, 1.0, 1.45, (Math.random() - 0.5) * 0.2, 0.8, (Math.random() - 0.5) * 0.2, '#c8c8c8', 1.6, -0.3, 0.4);
      }
    },
    start: { x: 16.2, z: 3.6, yaw: 0 },
    rats: [
      { x: 2.2, z: 6.0 }, { x: 2.5, z: 19.0 }, { x: 31.5, z: 7.5 }, { x: 35.3, z: 13.0 }, { x: 30.5, z: 22.5 },
      { x: 35.5, z: 17.5 }, { x: 18.5, z: 13.5 }, { x: 11.5, z: 28.3 }, { x: 26.5, z: 27.5 }, { x: 24.0, z: 7.5 },
    ],
    birds: [
      { x: 15.0, z: 5.0 }, { x: 12.0, z: 11.0 }, { x: 22.0, z: 17.0 }, { x: 33.0, z: 7.5 }, { x: 32.5, z: 19.5 }, { x: 9.0, z: 24.0 },
    ],
    dog: {
      name: 'Brutus',
      x: 30.7, z: 20.0,
      waypoints: [
        [30.7, 20.0, 3], [26, 20, 0], [17, 21, 1], [15, 9, 2], [8, 14.5, 0], [6.5, 10.8, 0], [2.5, 10.8, 0],
        [2.5, 3.0, 2], [2.5, 25.5, 0], [6.2, 25.5, 0], [12.5, 22, 1], [20, 21.5, 0], [27.5, 17, 0],
      ],
    },
    humans: [
      { name: 'Dad', x: 20.2, z: 2.45, yaw: Math.PI, pose: 'stand', shirt: '#3f88c5', hair: '#2b2b2b', skin: '#e0ac69' },
      { name: 'Mum', x: 33.4, z: 11.0, yaw: -Math.PI / 2, pose: 'sit', shirt: '#d1495b', hair: '#5a3825', skin: '#f1c27d', noSeat: true },
      { name: 'Nan', x: 20.6, z: 24.4, yaw: 0.9, pose: 'stand', shirt: '#9b72aa', hair: '#dcdcdc', skin: '#f5d0b5' },
    ],
    pickups: [
      ['toy', 9.0, 5.5], ['toy', 6.0, 8.0], ['toy', 2.5, 14.0], ['toy', 27.5, 5.0], ['toy', 33.4, 8.0],
      ['toy', 31.0, 27.0], ['toy', 15.0, 28.0], ['toy', 25.0, 22.0], ['fish', 5.8, 2.5], ['fish', 36.0, 17.0],
    ],
    goals: [
      { name: 'the sunny sun lounger', x: 20.7, z: 10.35, r: 0.6, minY: 0.3, maxY: 0.8 },
      { name: 'the warm shed roof', x: 34.8, z: 26.0, r: 1.0, minY: 1.9, maxY: 2.6 },
    ],
  };
}
