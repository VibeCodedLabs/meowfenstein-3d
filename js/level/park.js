// Level 3: The Park. Fountain plaza, rose garden, duck pond, playground, off-leash area.
import * as THREE from 'three';
import { Builder, mat } from './builder.js';
import * as TX from '../textures.js';
import { CatModel } from '../models/cat.js';

// Tile legend:
//   r  iron railing (street side)   #  hedge   f  low fence
//   P  footpath   Z  fountain plaza   L  big lawn   B  rose garden
//   W  duck pond (shallow - slow!)    Y  playground  O  off-leash dog area
export const PARK_MAP = [
  '#rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
  '#BBBBBBBBBBBBBLLLLLLLPPLLLLfYYYYYYYYYYYYYYYr',
  '#BBBBBBBBBBBBBLLLLLLLPPLLLLfYYYYYYYYYYYYYYYr',
  '#BBBBBBBBBBBBBLLLLLLLPPLLLLfYYYYYYYYYYYYYYYr',
  '#BBBBBBBBBBBBBLLLLLLLPPLLLLfYYYYYYYYYYYYYYYr',
  '#BBBBBBBBBBBBBLLLLLLLPPLLLLfYYYYYYYYYYYYYYYr',
  '#BBBBBBBBBBBBBLLLLLLLPPLLLLYYYYYYYYYYYYYYYYr',
  '#BBBBBBBBBBBBBLLLLLLLPPLLLLYYYYYYYYYYYYYYYYr',
  '#BBBBBBBBBBBBBLLLLLLLPPLLLLfYYYYYYYYYYYYYYYr',
  '#BBBBBBBBBBBBBLLLLLLLPPLLLLfYYYYYYYYYYYYYYYr',
  '#BBBBBBBBBBBBBLLLLLLLPPLLLLfYYYYYYYYYYYYYYYr',
  '#LLLLLLLLLLLLLLLLLLLLPPLLLLfYYYYYYYYYYYYYYYr',
  '#LLLLLLLLLLLLLLLLLZZZZZZZZLfYYYYYYYYYYYYYYYr',
  '#LLLLLLLLLLLLLLLLLZZZZZZZZLffffffYYffffffffr',
  '#LLLLLLLLLLLLLLLLLZZZZZZZZLLLLLLLLLLLLLLLLLr',
  '#PPPPPPPPPPPPPPPPPZZZZZZZZPPPPPPPPPPPPPPPPPr',
  '#PPPPPPPPPPPPPPPPPZZZZZZZZPPPPPPPPPPPPPPPPPr',
  '#LLLLLLLPPLLLLLLLLZZZZZZZZLLLLLLLLLLLLLLLLLr',
  '#LLLLLLLPPLLLLLLLLZZZZZZZZLLLLLLLLLLLLLLLLLr',
  '#LLLLLLLPPLLLLLLLLZZZZZZZZLLLLLLLLLLLLLLLLLr',
  '#LLLLLLLWPLLLLLLLLLLLPPLLLLfffffffOOfffffffr',
  '#LLLLWWWWWWWLLLLLLLLLPPLLLLfOOOOOOOOOOOOOOOr',
  '#LLLWWWWWWWWWLLLLLLLLPPLLLLfOOOOOOOOOOOOOOOr',
  '#LLWWWWWWWWWWWLLLLLLLPPLLLLfOOOOOOOOOOOOOOOr',
  '#LLWWWWWWWWWWWLLLLLLLPPLLLLfOOOOOOOOOOOOOOOr',
  '#LLWWWWWWWWWWWLLLLLLLPPLLLLOOOOOOOOOOOOOOOOr',
  '#LLWWWWWWWWWWWLLLLLLLPPLLLLOOOOOOOOOOOOOOOOr',
  '#LLLWWWWWWWWWLLLLLLLLPPLLLLfOOOOOOOOOOOOOOOr',
  '#LLLLWWWWWWWLLLLLLLLLPPLLLLfOOOOOOOOOOOOOOOr',
  '#LLLLLLLWPLLLLLLLLLLLPPLLLLfOOOOOOOOOOOOOOOr',
  '#LLLLLLLPPLLLLLLLLLLLPPLLLLfOOOOOOOOOOOOOOOr',
  '#LLLLLLLPPLLLLLLLLLLLPPLLLLfOOOOOOOOOOOOOOOr',
  '#LLLLLLLPPLLLLLLLLLLLPPLLLLfOOOOOOOOOOOOOOOr',
  '############################################',
];

export const PARK_ROOMS = {
  P: { name: 'Footpath', floor: 'pavement', floorColor: '#c9c4ba' },
  Z: { name: 'Fountain Plaza', floor: 'pavement', floorColor: '#d8cdb8' },
  L: { name: 'Big Lawn', floor: 'grass', floorColor: '#5f9e3d' },
  B: { name: 'Rose Garden', floor: 'grass', floorColor: '#6aa845' },
  W: { name: 'Duck Pond', floor: 'water', floorColor: '#3f7f8f' },
  Y: { name: 'Playground', floor: 'sand', floorColor: '#e6cf9c' },
  O: { name: 'Off-Leash Area', floor: 'grass', floorColor: '#7d9a45' },
};

export const PARK = {
  id: 'park',
  number: 3,
  name: 'The Park',
  map: PARK_MAP,
  walls: 'r#f',
  rooms: PARK_ROOMS,
  wallStyles: {
    r: { kind: 'railing', h: 1.4, cap: null },
    '#': { kind: 'hedge', h: 1.8, cap: '#3f7a35' },
    f: { kind: 'fence', h: 1.2, cap: '#7d5a3a' },
  },
  ceiling: false,
  timeLimit: 480,
  camMaxY: 6,
  flyMaxY: 6,
  attract: { cx: 22, cz: 16.5, rx: 7, rz: 5.5, y: 3, look: [22, 0.8, 16], cat: [17.3, 13.3] },
  intro: 'The park is overrun! Clear the rats, magpies and pigeons, then nap on the sunny bench or the playground fort.',
  cleared: 'The park is pest-free! Nap on the sunny bench in the Rose Garden, or up on the playground fort.',
  clearedText: 'cleared the park',
  build: buildPark,
};

// ---------------------------------------------------------------- props
function hipRoof(b, x, z, w, d, baseY, h, color) {
  const g = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.ConeGeometry(Math.SQRT1_2, h, 4, 1), mat(color));
  cone.rotation.y = Math.PI / 4;
  cone.position.y = h / 2;
  g.add(cone);
  g.position.set(x, baseY, z);
  g.scale.set(w, 1, d);
  b.root.add(g);
}

function tree(b, x, z, trunkH, canopy, colors, trunkR = 0.4) {
  b.cyl(x, z, trunkR * 0.7, trunkR, 0, trunkH, '#8d7b68');
  const leaf = colors.map((c) => mat(c));
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2, r = i === 0 ? 0 : canopy * 0.6;
    const m = b.deco(new THREE.SphereGeometry(canopy * (0.5 + Math.random() * 0.25), 10, 8), leaf[i % leaf.length],
      x + Math.cos(a) * r, trunkH + 0.5 + Math.random() * 1.0, z + Math.sin(a) * r);
    m.scale.y = 0.65;
  }
}

// Park bench: seat you can sit (or nap) on, plus a backrest. facing = direction a sitter looks.
function bench(b, x, z, facing, len = 1.6) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = facing;
  const wood = mat('#8a5a35'), iron = mat('#2a2a2a');
  const seat = new THREE.Mesh(new THREE.BoxGeometry(len, 0.06, 0.45), wood); seat.position.y = 0.45;
  const back = new THREE.Mesh(new THREE.BoxGeometry(len, 0.35, 0.05), wood); back.position.set(0, 0.72, -0.22); back.rotation.x = -0.15;
  g.add(seat, back);
  for (const sx of [-len / 2 + 0.08, len / 2 - 0.08]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.45), iron); leg.position.set(sx, 0.225, 0);
    g.add(leg);
  }
  b.root.add(g);
  // colliders (axis-aligned: benches face along an axis)
  const along = Math.abs(Math.sin(facing)) < 0.5; // seat runs along x
  const hx = along ? len / 2 : 0.225, hz = along ? 0.225 : len / 2;
  b.physics.addBox(x - hx, x + hx, z - hz, z + hz, 0, 0.48);
  const bx = x - Math.sin(facing) * 0.24, bz = z - Math.cos(facing) * 0.24;
  const tx = along ? len / 2 : 0.03, tz = along ? 0.03 : len / 2;
  b.physics.addBox(bx - tx, bx + tx, bz - tz, bz + tz, 0, 0.9);
}

function lampPost(b, x, z) {
  b.cyl(x, z, 0.05, 0.07, 0, 3.0, '#2a2a2a', { seg: 8 });
  b.deco(new THREE.SphereGeometry(0.18, 12, 10), new THREE.MeshStandardMaterial({ color: '#fff8e0', emissive: '#ffe9a8', emissiveIntensity: 0.6 }), x, 3.1, z);
}

function bin(b, x, z) {
  b.cyl(x, z, 0.28, 0.25, 0, 0.9, '#2f5d3a');
  b.deco(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 14), mat('#1f3d27'), x, 0.92, z);
}

function mallard() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), mat('#8a6a4a'));
  body.scale.set(1, 0.7, 1.5);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), mat('#1f6b3a', { metalness: 0.3, roughness: 0.4 }));
  head.position.set(0, 0.16, 0.18);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 6, 12), mat('#ffffff'));
  ring.position.set(0, 0.1, 0.17); ring.rotation.x = Math.PI / 2;
  const beak = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.08), mat('#e8b923'));
  beak.position.set(0, 0.15, 0.27);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 6), mat('#3a3a3a'));
  tail.position.set(0, 0.08, -0.24); tail.rotation.x = -2.2;
  g.add(body, head, ring, beak, tail);
  return g;
}

export function buildPark(scene, physics, level) {
  const b = new Builder(scene, physics, level);
  b.buildStructure(PARK);

  // ---------- sky, street and neighbourhood ----------
  scene.background = TX.sky();
  scene.fog = new THREE.Fog('#d9edf8', 35, 95);
  const outside = TX.grass('#4f8a35');
  outside.repeat.set(80, 80);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.MeshStandardMaterial({ map: outside, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(22, -0.02, 17);
  b.root.add(ground);
  const asphalt = mat('#3d3f44', { roughness: 0.95 });
  const kerb = mat('#bdb7ab');
  b.vbox(-12, 60, -9, -1.6, -0.015, -0.005, asphalt); // north street
  b.vbox(-12, 60, -1.6, 0, -0.015, 0.0, kerb);
  b.vbox(45.6, 54, -9, 45, -0.015, -0.005, asphalt); // east street
  b.vbox(44, 45.6, -1.6, 45, -0.015, 0.0, kerb);
  for (let x = -8; x < 58; x += 6) b.vbox(x, x + 3, -5.4, -5.2, -0.004, 0.0, mat('#f2f2f2')); // lane markings
  for (const [x, z, c, rot] of [[6, -3.2, '#c0392b', 0], [15, -3.2, '#2e86de', 0], [31, -3.2, '#f1c40f', 0], [47.3, 10, '#ecf0f1', Math.PI / 2], [47.3, 26, '#27ae60', Math.PI / 2]]) {
    const car = new THREE.Group();
    car.position.set(x, 0, z);
    car.rotation.y = rot;
    const shell = new THREE.Mesh(new THREE.BoxGeometry(4, 0.7, 1.8), mat(c, { metalness: 0.3, roughness: 0.4 })); shell.position.y = 0.55;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 1.6), mat('#9fc3d9', { metalness: 0.2, roughness: 0.2 })); cabin.position.set(-0.2, 1.15, 0);
    car.add(shell, cabin);
    for (const [wx, wz] of [[1.3, 0.85], [1.3, -0.85], [-1.3, 0.85], [-1.3, -0.85]]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.22, 14), mat('#1a1a1a')); w.position.set(wx, 0.33, wz); w.rotation.x = Math.PI / 2;
      car.add(w);
    }
    b.root.add(car);
  }
  for (const [x, z, w, d, c] of [[0, -16, 9, 8, '#a85b43'], [13, -16, 9, 8, '#8e8e8e'], [26, -16, 9, 8, '#7a4b3a'], [39, -16, 9, 8, '#b87652'],
    [59, 6, 8, 10, '#8d6e63'], [59, 22, 8, 10, '#9e9e9e'], [59, 38, 8, 10, '#a85b43']]) {
    b.vbox(x - w / 2, x + w / 2, z - d / 2, z + d / 2, 0, 3.2, mat(['#efe6d8', '#e0d6c8', '#f3eadc'][Math.floor(Math.abs(x + z)) % 3]));
    hipRoof(b, x, z, w + 0.8, d + 0.8, 3.2, 2.4, c);
  }
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2;
    const x = 22 + Math.cos(a) * (36 + Math.random() * 8), z = 17 + Math.sin(a) * (30 + Math.random() * 8);
    if (z < -2 && z > -12) continue; // keep the street clear
    b.deco(new THREE.CylinderGeometry(0.3, 0.45, 4, 6), mat('#8d7b68'), x, 2, z);
    const c = b.deco(new THREE.SphereGeometry(2.6 + Math.random() * 1.5, 8, 6), mat(['#3c6e3a', '#4f7d3b', '#5b8c44'][i % 3]), x, 5 + Math.random(), z);
    c.scale.y = 0.75;
  }

  // ---------- FOUNTAIN PLAZA ----------
  const rim = b.deco(new THREE.TorusGeometry(1.5, 0.16, 10, 36), mat('#c9c0b0'), 22, 0.3, 16);
  rim.rotation.x = Math.PI / 2;
  const basinWater = b.deco(new THREE.CircleGeometry(1.45, 32), new THREE.MeshStandardMaterial({ color: '#5fb3d0', roughness: 0.1, transparent: true, opacity: 0.85 }), 22, 0.22, 16);
  basinWater.rotation.x = -Math.PI / 2;
  physics.addBox(20.7, 23.3, 14.7, 17.3, 0, 0.0, 'water');
  b.cyl(22, 16, 0.22, 0.3, 0, 1.3, mat('#c9c0b0'));
  b.deco(new THREE.CylinderGeometry(0.65, 0.3, 0.2, 20), mat('#c9c0b0'), 22, 1.35, 16);
  b.deco(new THREE.SphereGeometry(0.12, 10, 8), mat('#c9c0b0'), 22, 1.6, 16);
  bench(b, 19.2, 12.8, 0); bench(b, 24.8, 12.8, 0);
  bench(b, 19.2, 19.2, Math.PI); bench(b, 24.8, 19.2, Math.PI);
  for (const [x, z] of [[18.3, 12.3], [25.7, 12.3], [18.3, 19.7], [25.7, 19.7]]) lampPost(b, x, z);
  bin(b, 17.6, 14.4); bin(b, 26.4, 17.6);

  // ---------- ICE CREAM VAN (climb: bumper -> cab -> roof) ----------
  b.box(23.4, 25.4, 5.2, 8.6, 0, 2.1, mat('#f7f4ef', { roughness: 0.5 }));
  b.vbox(23.38, 25.42, 5.2, 8.6, 1.2, 1.45, mat('#ff8fb1'));
  b.box(23.5, 25.3, 8.6, 9.9, 0, 1.55, mat('#f7f4ef', { roughness: 0.5 }));
  b.vbox(23.55, 25.25, 9.88, 9.92, 1.0, 1.45, mat('#9fc3d9', { roughness: 0.2 }));
  b.box(23.6, 25.2, 9.9, 10.5, 0, 0.95, mat('#ff8fb1'));
  b.vbox(25.4, 25.42, 5.8, 7.8, 0.95, 1.7, mat('#333'));
  const awning = b.deco(new THREE.BoxGeometry(0.6, 0.04, 2.2), mat('#ff5d8f'), 25.7, 1.8, 6.8);
  awning.rotation.z = -0.3;
  for (const [x, z] of [[23.7, 5.6], [25.1, 5.6], [23.7, 9.9], [25.1, 9.9]]) {
    const w = b.deco(new THREE.CylinderGeometry(0.35, 0.35, 0.25, 14), mat('#1a1a1a'), x + (x < 24 ? -0.08 : 0.08), 0.35, z);
    w.rotation.z = Math.PI / 2;
  }
  b.deco(new THREE.ConeGeometry(0.3, 0.8, 12), mat('#d9a35b'), 24.4, 2.5, 5.6).rotation.x = Math.PI;
  b.deco(new THREE.SphereGeometry(0.3, 12, 10), mat('#ffb6c8'), 24.4, 3.0, 5.6);
  b.deco(new THREE.SphereGeometry(0.22, 12, 10), mat('#8b5a3c'), 24.4, 3.35, 5.6);

  // ---------- ROSE GARDEN ----------
  const rose = ['#d62839', '#ff8fab', '#ffffff', '#ffd166'];
  for (const [x0, x1, z0, z1] of [[2, 5.5, 2, 4], [8.5, 12, 2, 4], [2, 5.5, 7.5, 9.5], [8.5, 12, 7.5, 9.5]]) {
    b.box(x0, x1, z0, z1, 0, 0.35, '#8a6440');
    for (let x = x0 + 0.4; x < x1 - 0.2; x += 0.6)
      for (let z = z0 + 0.4; z < z1 - 0.2; z += 0.6) {
        b.deco(new THREE.SphereGeometry(0.2, 8, 6), mat('#2f6b2a'), x, 0.5, z);
        b.deco(new THREE.SphereGeometry(0.07, 8, 6), mat(rose[Math.floor((x + z) * 3) % rose.length]), x + 0.08, 0.66, z + 0.05);
      }
  }
  // bronze cat statue on a plinth (the plinth is a dog-safe perch)
  b.box(6.2, 7.8, 4.95, 6.55, 0, 1.0, mat('#b8b2a6'));
  const statue = new CatModel('black', 'regular');
  const bronze = new THREE.MeshStandardMaterial({ color: '#8c6a3f', metalness: 0.75, roughness: 0.35 });
  statue.root.traverse((o) => { if (o.isMesh) o.material = bronze; if (o.isLineSegments) o.visible = false; });
  statue.popTart.visible = false;
  statue.root.scale.setScalar(1.6);
  statue.root.position.set(7.0, 1.0, 5.75);
  statue.root.rotation.y = 0.5;
  statue.tail.forEach((s, i) => { s.rotation.x = i === 0 ? -1.15 : 0.17; });
  b.root.add(statue.root);
  physics.addBox(6.65, 7.35, 5.3, 6.2, 1.0, 1.95);
  bench(b, 7.0, 10.25, Math.PI); // the sunny bench (nap spot)
  const glow = b.deco(new THREE.CircleGeometry(1.0, 24), new THREE.MeshBasicMaterial({ color: '#fff3c9', transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending }), 7.0, 0.02, 10.25);
  glow.rotation.x = -Math.PI / 2;
  bench(b, 2.3, 6.0, Math.PI / 2); // Grandpa Joe's bench
  for (const [x, z] of [[0.9 + 1.2, 1.4], [13.2, 1.4], [13.2, 10.4]]) {
    const ball = b.deco(new THREE.SphereGeometry(0.45, 12, 10), mat('#3f7a35'), x, 0.45, z);
    void ball;
    physics.addBox(x - 0.4, x + 0.4, z - 0.4, z + 0.4, 0, 0.85);
  }

  // ---------- DUCK POND ----------
  for (let z = 0; z < level.h; z++) {
    let run = -1;
    for (let x = 0; x <= level.w; x++) {
      const wet = level.cell(x, z) === 'W';
      if (wet && run < 0) run = x;
      if (!wet && run >= 0) { physics.addBox(run, x, z, z + 1, 0, 0.0, 'water'); run = -1; }
    }
  }
  // arched footbridge (each step is low enough to walk up)
  const plank = new THREE.MeshStandardMaterial({ map: TX.decking('#9b7653'), roughness: 0.9 });
  for (const [z0, z1, h] of [[19.6, 20.4, 0.12], [20.4, 21.2, 0.24], [21.2, 28.8, 0.36], [28.8, 29.6, 0.24], [29.6, 30.4, 0.12]]) {
    b.box(7.8, 9.6, z0, z1, 0, h, plank);
  }
  for (const x of [7.75, 9.65]) {
    b.box(x - 0.05, x + 0.05, 21.2, 28.8, 0.36, 1.1, mat('#6b4b35'), { colliderBottom: 0 });
  }
  const lily = mat('#4f9a3f');
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random();
    const x = 8.5 + Math.cos(a) * r * 4.5, z = 25 + Math.sin(a) * r * 3.6;
    if (Math.abs(x - 8.7) < 1.2) continue;
    const p = b.deco(new THREE.CircleGeometry(0.22, 12), lily, x, 0.03, z);
    p.rotation.x = -Math.PI / 2;
  }
  for (const [x, z] of [[3.6, 22.4], [13.4, 27.6], [4.2, 28.6], [13.0, 22.0]]) {
    for (let k = 0; k < 6; k++) {
      const reed = b.deco(new THREE.CylinderGeometry(0.015, 0.02, 0.9, 5), mat('#6b8f3a'), x + (Math.random() - 0.5) * 0.5, 0.45, z + (Math.random() - 0.5) * 0.5);
      reed.rotation.z = (Math.random() - 0.5) * 0.3;
    }
  }
  const ducks = [];
  for (let i = 0; i < 4; i++) {
    const d = mallard();
    d.userData = { a: (i / 4) * Math.PI * 2, rx: 2.0 + i * 0.6, rz: 1.6 + i * 0.4, speed: 0.15 + i * 0.04 };
    b.root.add(d);
    ducks.push(d);
  }
  // picnic by the pond
  b.rug(15.4, 18.0, 23.0, 25.0, '#d62839', '#ffffff');
  b.box(16.9, 17.5, 23.3, 23.7, 0, 0.35, mat('#b5835a'));

  // ---------- BIG LAWN ----------
  tree(b, 16.0, 6.5, 4.0, 3.2, ['#3f6b35', '#4d7a3c', '#355c2c'], 0.75); // Moreton Bay fig
  tree(b, 3.5, 13.0, 3.6, 2.0, ['#5b7f3a', '#6b8f45']);
  tree(b, 31.5, 18.6, 3.4, 1.9, ['#5b7f3a', '#4d6e33']);
  tree(b, 13.5, 31.0, 3.6, 2.0, ['#6b8f45', '#5b7f3a']);
  tree(b, 25.0, 30.0, 3.2, 1.8, ['#9b7fd1', '#b39ddb']);
  tree(b, 38.0, 18.6, 3.4, 1.9, ['#5b7f3a', '#6b8f45']);
  b.table(10.6, 12.4, 12.4, 13.4, 0.75, '#8a5a35');
  b.box(10.6, 12.4, 11.85, 12.2, 0, 0.45, mat('#8a5a35'));
  b.box(10.6, 12.4, 13.6, 13.95, 0, 0.45, mat('#8a5a35'));
  for (const [x, z] of [[6.6, 14.3], [30.6, 14.3], [19.8, 28.4], [23.7, 3.6], [36.0, 19.4]]) bin(b, x, z);
  for (const [x, z] of [[12.2, 17.6], [30.2, 17.6], [20.2, 24.0], [23.8, 10.8]]) lampPost(b, x, z);

  // ---------- PLAYGROUND ----------
  const fortWood = mat('#c0392b');
  b.box(31.0, 32.0, 3.4, 4.4, 0, 0.5, mat('#f4a261'));
  b.box(32.0, 33.0, 3.4, 4.4, 0, 1.0, mat('#e9c46a'));
  b.box(33.0, 35.6, 3.0, 5.6, 1.42, 1.5, mat('#2a9d8f'), { colliderBottom: 0 });
  for (const [x, z] of [[33.1, 3.1], [35.5, 3.1], [33.1, 5.5], [35.5, 5.5]]) b.cyl(x, z, 0.07, 0.07, 0, 1.42, fortWood, { collide: false, seg: 8 });
  b.box(34.4, 35.6, 3.0, 4.2, 1.97, 2.05, mat('#264653'), { colliderBottom: 0 }); // lookout turret (nap spot)
  for (const [x, z] of [[34.45, 3.05], [35.55, 3.05], [34.45, 4.15], [35.55, 4.15]]) b.cyl(x, z, 0.04, 0.04, 2.05, 2.75, fortWood, { collide: false, seg: 6 });
  b.deco(new THREE.ConeGeometry(0.95, 0.7, 4), fortWood, 35.0, 3.1, 3.6, Math.PI / 4);
  const slide = b.deco(new THREE.BoxGeometry(0.7, 0.06, 3.3), mat('#ffd166', { roughness: 0.3 }), 35.3, 0.8, 7.1);
  slide.rotation.x = 0.42;
  physics.addBox(34.95, 35.65, 8.4, 8.8, 0, 0.18);
  const mgr = b.deco(new THREE.CylinderGeometry(1.1, 1.1, 0.12, 24), mat('#e63946'), 31.5, 0.3, 9.5);
  physics.addBox(30.6, 32.4, 8.6, 10.4, 0, 0.36);
  for (const [x, z] of [[37.4, 8.5], [37.4, 9.3], [41.0, 8.5], [41.0, 9.3]]) {
    const leg = b.deco(new THREE.CylinderGeometry(0.04, 0.04, 2.1, 6), mat('#457b9d'), x, 1.0, z);
    leg.rotation.x = z < 8.9 ? 0.18 : -0.18;
  }
  b.deco(new THREE.CylinderGeometry(0.05, 0.05, 3.7, 8), mat('#457b9d'), 39.2, 2.0, 8.9).rotation.z = Math.PI / 2;
  for (const x of [38.5, 39.9]) {
    b.box(x - 0.22, x + 0.22, 8.78, 9.02, 0.42, 0.47, mat('#ffd166'));
    for (const dx of [-0.2, 0.2]) b.deco(new THREE.CylinderGeometry(0.008, 0.008, 1.53, 4), mat('#999'), x + dx, 1.23, 8.9);
  }
  const seesaw = b.deco(new THREE.BoxGeometry(3.0, 0.08, 0.35), mat('#06d6a0'), 37.5, 0.4, 11.6);
  seesaw.rotation.z = 0.2;
  physics.addBox(37.3, 37.7, 11.4, 11.8, 0, 0.35);

  // ---------- OFF-LEASH AREA ----------
  for (const [x, z] of [[31.0, 24.8], [34.5, 28.2], [38.6, 24.4]]) {
    for (const dz of [-0.6, 0.6]) b.cyl(x, z + dz, 0.04, 0.04, 0, 0.55, '#ffffff', { collide: false, seg: 6 });
    b.box(x - 0.05, x + 0.05, z - 0.6, z + 0.6, 0.3, 0.42, mat('#e63946'), { colliderBottom: 0 });
  }
  // tunnel: a cat fits through, a dog doesn't
  const tunnel = b.deco(new THREE.CylinderGeometry(0.55, 0.55, 3.0, 16, 1, true, -Math.PI / 2, Math.PI), new THREE.MeshStandardMaterial({ color: '#1d70b8', side: THREE.DoubleSide, roughness: 0.6 }), 38.0, 0.05, 29.5);
  tunnel.rotation.z = Math.PI / 2;
  physics.addBox(36.5, 39.5, 28.9, 29.0, 0, 0.62);
  physics.addBox(36.5, 39.5, 30.0, 30.1, 0, 0.62);
  physics.addBox(36.5, 39.5, 28.9, 30.1, 0.56, 0.62);
  b.cyl(29.2, 21.8, 0.2, 0.18, 0, 0.12, '#c0c0c0'); // water bowl
  b.deco(new THREE.SphereGeometry(0.12, 12, 10), mat('#c6ff00'), 33.0, 0.12, 30.5); // tennis ball

  // ---------- LIGHTING ----------
  scene.add(new THREE.HemisphereLight('#d6ecff', '#6a8a4a', 1.5));
  const sun = new THREE.DirectionalLight('#fff1d0', 2.4);
  sun.position.set(20, 30, 25);
  scene.add(sun);

  return {
    update(dt, time, game) {
      mgr.rotation.y += dt * 0.6;
      for (const d of ducks) {
        const u = d.userData;
        u.a += dt * u.speed;
        d.position.set(8.5 + Math.cos(u.a) * u.rx, 0.06 + Math.sin(time * 2 + u.rx) * 0.02, 25 + Math.sin(u.a) * u.rz);
        d.rotation.y = -u.a;
      }
      if (game) {
        for (let i = 0; i < 3; i++) {
          const a = Math.random() * Math.PI * 2;
          game.particles.emit(22, 1.65, 16, Math.cos(a) * 0.9, 2.2 + Math.random(), Math.sin(a) * 0.9, '#bfe9ff', 0.9, 6, 0.2);
        }
      }
    },
    start: { x: 2.5, z: 16.0, yaw: Math.PI / 2 },
    rats: [
      { x: 6.6, z: 13.6 }, { x: 30.6, z: 13.6 }, { x: 19.6, z: 27.6 }, { x: 24.2, z: 4.2 }, { x: 24.4, z: 11.4 },
      { x: 10.5, z: 6.2 }, { x: 14.6, z: 23.6 }, { x: 4.5, z: 31.0 }, { x: 30.5, z: 11.4 }, { x: 40.5, z: 2.5 },
      { x: 32.5, z: 31.5 }, { x: 41.0, z: 22.5 },
    ],
    birds: [
      { x: 16.0, z: 9.5 }, { x: 30.0, z: 17.5 }, { x: 36.0, z: 7.0 }, { x: 12.0, z: 29.0 },
      { x: 4.5, z: 6.5, type: 'pigeon' }, { x: 5.5, z: 8.0, type: 'pigeon' }, { x: 22.0, z: 13.4, type: 'pigeon' },
      { x: 21.5, z: 18.6, type: 'pigeon' }, { x: 18.0, z: 25.5, type: 'pigeon' }, { x: 35.5, z: 26.0, type: 'pigeon' },
    ],
    dogs: [
      {
        name: 'Brutus',
        x: 21.5, z: 31.0,
        waypoints: [
          [21.5, 31.0, 2], [21.5, 21.5, 0], [12.0, 16.0, 0], [3.0, 16.0, 1.5], [12.0, 16.5, 0], [19.5, 14.0, 0],
          [21.5, 2.5, 2], [21.5, 11.0, 0], [30.0, 16.0, 0], [41.0, 16.0, 2], [30.0, 16.5, 0], [22.0, 20.5, 0],
        ],
      },
      {
        name: 'Bella',
        coat: { main: '#d9a441', dark: '#a8742a', light: '#f0d39a' },
        x: 40.0, z: 31.0,
        waypoints: [
          [40.0, 31.0, 3], [34.8, 24.0, 0], [34.8, 20.4, 0], [36.0, 17.8, 1], [29.0, 18.0, 0], [27.5, 25.9, 0],
          [18.5, 27.5, 1.5], [16.0, 20.5, 0], [26.2, 25.9, 0], [31.0, 27.0, 0],
        ],
      },
    ],
    humans: [
      { name: 'Grandpa Joe', x: 2.35, z: 6.0, yaw: Math.PI / 2, pose: 'sit', shirt: '#6b705c', hair: '#e8e8e8', skin: '#f1c27d', noSeat: true },
      { name: 'Gus', x: 26.2, z: 7.0, yaw: 0, pose: 'stand', shirt: '#ffffff', hair: '#3b2a20', skin: '#c68642' },
      { name: 'Priya', x: 39.4, z: 6.4, yaw: 0, pose: 'stand', shirt: '#e76f51', hair: '#1b1b1b', skin: '#c68642' },
      { name: 'Sam', x: 16.4, z: 24.4, yaw: -Math.PI / 2, pose: 'sit', shirt: '#2a9d8f', hair: '#7a4b2a', skin: '#e0ac69', noSeat: true },
    ],
    pickups: [
      ['toy', 12.5, 11.4], ['toy', 3.0, 31.0], ['toy', 18.8, 31.0], ['toy', 29.5, 2.5], ['toy', 41.0, 11.0],
      ['toy', 36.0, 32.0], ['toy', 30.5, 22.6], ['toy', 26.2, 22.5], ['toy', 14.5, 18.6],
      ['fish', 2.5, 2.5], ['fish', 41.5, 18.5], ['fish', 15.0, 31.5],
    ],
    goals: [
      { name: 'the sunny park bench', x: 7.0, z: 10.25, r: 0.55, minY: 0.4, maxY: 0.8 },
      { name: 'the top of the playground fort', x: 35.0, z: 3.6, r: 0.5, minY: 1.95, maxY: 2.6 },
    ],
  };
}
