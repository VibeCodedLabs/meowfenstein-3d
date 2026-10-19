// Level 4: Grandma's House. Two storeys of doilies, china and floral wallpaper.
// Grandma's budgies have escaped, mice are in the walls, Princess the Chihuahua
// yaps at everything, and the robot vacuum is on the loose.
import * as THREE from 'three';
import { Builder, mat } from './builder.js';
import * as TX from '../textures.js';

const UP = 3.0; // height of the upstairs floor

// Tile legend (both floors):
//   #  wall   G  window   F  front door   d  doorway   h  stairwell (open to below)
//   Downstairs: S sitting room  E front hall  K kitchen  N dining room  C conservatory
//   Upstairs:   B bedroom  R craft room  U landing  T bathroom  Q spare room
export const GRANDMA_GROUND = [
  '###GG##GG##########GG###',
  '#SSSSSSSSSS#EEEE#KKKKKK#',
  '#SSSSSSSSSS#EEEE#KKKKKK#',
  '#SSSSSSSSSS#EEEE#KKKKKKG',
  'GSSSSSSSSSS#EEEEdKKKKKKG',
  'GSSSSSSSSSSdEEEE#KKKKKKG',
  'GSSSSSSSSSS#EEEE#KKKKKK#',
  '#SSSSSSSSSS#EEEE#KKKKKK#',
  '#SSSSSSSSSS#EEEE#KKKKKK#',
  '#SSSSSSSSSS#EEEE###d####',
  '#####d######EEEE#NNNNNN#',
  'GCCCCCCCCCC#EEEE#NNNNNN#',
  'GCCCCCCCCCC#EEEE#NNNNNNG',
  'GCCCCCCCCCC#EEEEdNNNNNNG',
  'GCCCCCCCCCCdEEEE#NNNNNNG',
  'GCCCCCCCCCC#EEEE#NNNNNN#',
  'GCCCCCCCCCC#EEEE#NNNNNN#',
  '#GGGGGGGGGG##FF####GG###',
];

export const GRANDMA_UPSTAIRS = [
  '###GG##GG##########GG###',
  '#BBBBBBBBBB#UUUU#TTTTTT#',
  '#BBBBBBBBBB#UUUU#TTTTTT#',
  '#BBBBBBBBBB#UUUUdTTTTTTG',
  'GBBBBBBBBBB#UhhU#TTTTTTG',
  'GBBBBBBBBBBdUhhU#TTTTTT#',
  'GBBBBBBBBBB#UhhU#TTTTTT#',
  '#BBBBBBBBBB#UhhU#TTTTTT#',
  '#BBBBBBBBBB#UhhU###d####',
  '#BBBBBBBBBB#UhhU#QQQQQQ#',
  '############UhhU#QQQQQQ#',
  '#RRRRRRRRRR#UhhU#QQQQQQG',
  'GRRRRRRRRRR#UUUUdQQQQQQG',
  'GRRRRRRRRRR#UUUU#QQQQQQG',
  'GRRRRRRRRRRdUUUU#QQQQQQ#',
  '#RRRRRRRRRR#UUUU#QQQQQQ#',
  '#RRRRRRRRRR#UUUU#QQQQQQ#',
  '####GGG############GG###',
];

export const GRANDMA_ROOMS = {
  S: { name: 'Sitting Room', floor: 'carpet', floorColor: '#8a5a6a', wall: '#f3e0d8', wallStyle: 'floral', wallAccent: '#d98ba0' },
  E: { name: 'Front Hall', floor: 'wood', floorColor: '#7a4b2a', wall: '#e9dfc8', wallStyle: 'stripes' },
  K: { name: 'Kitchen', floor: 'tile', floorColor: ['#e9e4c9', '#9ec1a3'], wall: '#d8efe0', wallStyle: 'tiles', wallAccent: '#b8dcc6' },
  N: { name: 'Dining Room', floor: 'wood', floorColor: '#8a5a33', wall: '#efe2c4', wallStyle: 'floral', wallAccent: '#c9a227' },
  C: { name: 'Conservatory', floor: 'tile', floorColor: ['#e8d8c0', '#c9b294'], wall: '#fff6dc', wallStyle: 'stripes', sunny: true },
  B: { name: "Grandma's Bedroom", floor: 'carpet', floorColor: '#b58aa5', wall: '#f4e1ea', wallStyle: 'floral', wallAccent: '#c77dff' },
  R: { name: 'Craft Room', floor: 'carpet', floorColor: '#7d8f69', wall: '#eef3df', wallStyle: 'dots' },
  U: { name: 'Landing', floor: 'carpet', floorColor: '#9b3d3d', wall: '#e9dfc8', wallStyle: 'stripes' },
  T: { name: 'Pink Bathroom', floor: 'tile', floorColor: ['#ffd6e0', '#f4a6bc'], wall: '#ffe3ea', wallStyle: 'tiles', wallAccent: '#f7b8c9' },
  Q: { name: 'Spare Room', floor: 'carpet', floorColor: '#8b93b8', wall: '#e6e9f2', wallStyle: 'floral', wallAccent: '#7aa0c4' },
  h: { name: 'Stairwell', floor: 'carpet', floorColor: '#9b3d3d', wall: '#e9dfc8', hole: true },
};

export const GRANDMA = {
  id: 'grandma',
  number: 4,
  name: "Grandma's House",
  maps: [GRANDMA_GROUND, GRANDMA_UPSTAIRS],
  floorY: [0, UP],
  storeyH: UP,
  topCeilingH: 2.6,
  walls: '#GF',
  doorRoom: ['E', 'U'],
  rooms: GRANDMA_ROOMS,
  wallStyles: { '#': { kind: 'wallpaper', h: 2.6 }, G: { kind: 'window', h: 2.6 }, F: { kind: 'innerDoor', h: 2.6 } },
  ceiling: true,
  timeLimit: 420,
  camMaxY: 2.45,
  flyMaxY: 2.35,
  background: '#2a2030',
  attract: { cx: 6, cz: 5.5, rx: 3.2, rz: 2.4, y: 1.6, look: [5.5, 0.6, 4.5], cat: [6.2, 6.6] },
  intro: "Grandma's budgies escaped and mice are in the walls! Clear the pests AND find her 5 lost yarn balls. Smashing ornaments takes time off your score...",
  cleared: "All done! Nap in the sunny conservatory window seat, or on Grandma's quilted bed upstairs.",
  clearedText: "sorted out Grandma's house",
  build: buildGrandma,
};

// ---------------------------------------------------------------- props
function light(scene, b, x, y, z, color = '#fff1d6', power = 7, range = 8) {
  const pl = new THREE.PointLight(color, power, range, 1.6);
  pl.position.set(x, y, z);
  scene.add(pl);
  b.deco(new THREE.CylinderGeometry(0.22, 0.3, 0.12, 16), new THREE.MeshStandardMaterial({ color: '#fff', emissive: color, emissiveIntensity: 1.1 }), x, y + 0.24, z);
  return pl;
}

function wallFrame(b, x, y, z, rotY, w = 0.35, h = 0.45) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.03), mat('#c9a227', { metalness: 0.6, roughness: 0.35 })));
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.07, h - 0.07), mat(['#a07a5a', '#7d8f69', '#8fa7c4', '#c79fa5'][Math.floor(x + z) % 4]));
  pic.position.z = 0.017;
  g.add(pic);
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  b.root.add(g);
}

function doily(b, x, y, z, r = 0.22) {
  const d = b.deco(new THREE.CircleGeometry(r, 18), new THREE.MeshStandardMaterial({ color: '#fbf8f0', roughness: 1, side: THREE.DoubleSide }), x, y + 0.004, z);
  d.rotation.x = -Math.PI / 2;
}

// sofa / armchair: seat + back + arms. backSide: 'n' | 's' | 'e' | 'w'
function seat(b, x0, x1, z0, z1, backSide, fabricMat) {
  b.box(x0, x1, z0, z1, 0, 0.45, fabricMat);
  const t = 0.28;
  if (backSide === 'n') b.box(x0, x1, z0 - t, z0, 0, 0.92, fabricMat);
  if (backSide === 's') b.box(x0, x1, z1, z1 + t, 0, 0.92, fabricMat);
  if (backSide === 'e') b.box(x1, x1 + t, z0, z1, 0, 0.92, fabricMat);
  if (backSide === 'w') b.box(x0 - t, x0, z0, z1, 0, 0.92, fabricMat);
}

export function buildGrandma(scene, physics, level) {
  const b = new Builder(scene, physics, level);
  b.buildStructure(GRANDMA);

  const wood = mat('#6b4423'), darkWood = mat('#4a2e17'), cream = mat('#f4efe2');
  const chintz = new THREE.MeshStandardMaterial({ map: TX.fabric('#c98a9b'), roughness: 1 });
  const velvet = new THREE.MeshStandardMaterial({ map: TX.fabric('#5b7f6a'), roughness: 1 });
  const crochet = new THREE.MeshStandardMaterial({ map: TX.patchwork(), roughness: 1 });

  // ================================================================ STAIRS + UPSTAIRS FLOOR
  // carpet runner on the treads, painted risers, panelled sides (box faces: +x -x +y -y +z -z)
  const runner = mat('#9b3d3d'), riser = mat('#efe6d6'), panel = mat('#e4d7c0');
  const stepMat = [panel, panel, runner, panel, riser, riser];
  const N = 30, depth = 8 / N;
  for (let i = 0; i < N; i++) {
    const z1 = 12 - i * depth, z0 = z1 - depth, top = (i + 1) * (UP / N);
    b.box(13.02, 14.98, z0, z1, 0, top, stepMat);
  }
  // banister on the open sides of the staircase (visual) and around the stairwell upstairs
  for (const x of [13.0, 15.0]) {
    const rail = b.deco(new THREE.BoxGeometry(0.06, 0.06, 8.6), cream, x, UP / 2 + 0.9, 8);
    rail.rotation.x = Math.atan2(UP, 8);
    for (let z = 4.4; z < 12; z += 0.55) b.deco(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 6), cream, x, (12 - z) / 8 * UP + 0.45, z);
  }
  for (const [x0, x1, z0, z1] of [[12.95, 13.05, 4, 12], [14.95, 15.05, 4, 12], [13, 15, 11.95, 12.05]]) {
    physics.addBox(x0, x1, z0, z1, UP, UP + 0.95);
    b.vbox(x0 - 0.02, x1 + 0.02, z0, z1, UP + 0.88, UP + 0.95, wood); // hand rail
    const alongZ = z1 - z0 > x1 - x0;
    for (let t = 0.15; t < (alongZ ? z1 - z0 : x1 - x0); t += 0.3) {
      const x = alongZ ? (x0 + x1) / 2 : x0 + t, z = alongZ ? z0 + t : (z0 + z1) / 2;
      b.deco(new THREE.CylinderGeometry(0.022, 0.022, 0.88, 6), cream, x, UP + 0.44, z);
    }
  }
  // the upstairs floor (open over the stairwell)
  for (let z = 0; z < level.h; z++) {
    let run = -1;
    for (let x = 0; x <= level.w; x++) {
      const c = level.cell(x, z, 1);
      const solid = x < level.w && !level.isWallChar(c) && c !== 'h';
      if (solid && run < 0) run = x;
      if (!solid && run >= 0) { physics.addBox(run, x, z, z + 1, UP - 0.15, UP); run = -1; }
    }
  }

  // ================================================================ DOWNSTAIRS
  // ---- sitting room (x 1-11, z 1-10)
  b.rug(2.6, 9.0, 3.0, 8.4, '#7a2e3e', '#e8c9a0');
  seat(b, 2.0, 5.2, 1.4, 2.3, 'n', chintz); // floral sofa
  b.vbox(2.1, 5.1, 1.13, 1.42, 0.55, 0.95, crochet); // crocheted blanket over the back
  seat(b, 7.8, 9.0, 1.5, 2.5, 'n', velvet); // Doris's armchair
  b.vbox(8.15, 8.65, 1.25, 1.5, 0.93, 0.94, cream); // antimacassar
  b.box(3.0, 5.0, 3.8, 5.0, 0, 0.45, wood); // coffee table
  doily(b, 4.0, 0.45, 4.4);
  // fireplace + mantel (reach it from the footstool)
  b.box(1.0, 1.6, 3.8, 6.2, 0, 1.1, mat('#b8826a'));
  b.box(1.0, 1.75, 3.6, 6.4, 1.1, 1.2, darkWood, { colliderBottom: 0 });
  const fire = b.deco(new THREE.BoxGeometry(0.05, 0.45, 1.2), new THREE.MeshStandardMaterial({ color: '#ff7b00', emissive: '#ff5a00', emissiveIntensity: 1.2 }), 1.62, 0.3, 5.0);
  b.box(2.0, 2.6, 6.6, 7.2, 0, 0.4, chintz); // footstool
  wallFrame(b, 1.03, 1.8, 5.0, Math.PI / 2, 0.6, 0.45);
  // CRT telly with rabbit ears
  b.box(9.6, 10.9, 4.2, 5.6, 0, 0.6, wood);
  b.box(9.9, 10.75, 4.5, 5.3, 0.6, 1.25, mat('#5a4a3a'));
  b.deco(new THREE.PlaneGeometry(0.62, 0.48), new THREE.MeshStandardMaterial({ color: '#223', emissive: '#7fa8d1', emissiveIntensity: 0.5 }), 9.89, 0.93, 4.9, -Math.PI / 2);
  for (const s of [1, -1]) {
    const ear = b.deco(new THREE.CylinderGeometry(0.006, 0.006, 0.6, 4), mat('#ccc', { metalness: 0.8 }), 10.3, 1.5, 4.9 + s * 0.12);
    ear.rotation.x = s * 0.5;
  }
  // grandfather clock (pendulum swings)
  b.box(10.25, 10.95, 8.5, 9.3, 0, 2.15, darkWood);
  b.deco(new THREE.CircleGeometry(0.2, 20), cream, 10.24, 1.8, 8.9, -Math.PI / 2);
  const pendulum = new THREE.Group();
  pendulum.position.set(10.22, 1.45, 8.9);
  const bob = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16), mat('#d4af37', { metalness: 0.8, roughness: 0.3 }));
  bob.rotation.z = Math.PI / 2; bob.position.y = -0.55;
  pendulum.add(bob, new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.55, 0.01), mat('#d4af37')));
  pendulum.children[1].position.y = -0.27;
  b.root.add(pendulum);
  // empty budgie cage, door open (they escaped!)
  b.cyl(4.0, 8.9, 0.03, 0.18, 0, 1.2, mat('#d4af37', { metalness: 0.6 }), { seg: 8 });
  const cage = b.deco(new THREE.CylinderGeometry(0.28, 0.28, 0.5, 14, 1, true), new THREE.MeshStandardMaterial({ color: '#d4af37', wireframe: true }), 4.0, 1.45, 8.9);
  void cage;
  b.deco(new THREE.SphereGeometry(0.28, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#d4af37', wireframe: true }), 4.0, 1.7, 8.9);
  // rocking chair, lamp, china cabinet, knitting basket, plants
  b.box(8.8, 9.6, 7.4, 8.2, 0, 0.45, wood);
  b.vbox(8.8, 9.6, 8.2, 8.26, 0.45, 1.05, wood);
  b.cyl(2.2, 8.9, 0.04, 0.04, 0, 1.5, '#5a3a28', { seg: 6 });
  b.deco(new THREE.CylinderGeometry(0.18, 0.3, 0.3, 14, 1, true), new THREE.MeshStandardMaterial({ color: '#f2c8a0', emissive: '#ffcf8a', emissiveIntensity: 0.4, side: THREE.DoubleSide }), 2.2, 1.6, 8.9);
  b.box(6.4, 8.4, 9.4, 9.98, 0, 1.9, darkWood); // china cabinet
  b.vbox(6.5, 8.3, 9.38, 9.4, 0.3, 1.8, new THREE.MeshStandardMaterial({ color: '#cfe3f0', transparent: true, opacity: 0.35, roughness: 0.05 }));
  for (let i = 0; i < 4; i++) b.deco(new THREE.CircleGeometry(0.13, 16), mat(['#f7f4ee', '#2f5fa8'][i % 2]), 6.8 + i * 0.45, 1.25, 9.5);
  b.cyl(7.3, 3.0, 0.22, 0.18, 0, 0.3, '#c9a66b'); // knitting basket
  for (let i = 0; i < 3; i++) b.deco(new THREE.SphereGeometry(0.1, 10, 8), mat(['#e63946', '#4cc9f0', '#ffd166'][i]), 7.25 + (i - 1) * 0.12, 0.34, 3.0);
  b.plant(10.3, 1.6, '#c06030', 0.9);
  wallFrame(b, 6, 1.7, 1.02, 0); wallFrame(b, 9, 1.8, 1.02, 0, 0.3, 0.4);

  // ---- front hall (x 12-16)
  b.rug(12.1, 15.9, 12.4, 16.8, '#7a2e3e', '#d6c5a0');
  b.box(15.45, 15.98, 14.2, 15.8, 0, 0.85, wood); // hall table
  doily(b, 15.72, 0.85, 15.0, 0.18);
  b.cyl(12.4, 16.5, 0.14, 0.12, 0, 0.6, '#3a5a7a'); // umbrella stand
  b.cyl(15.6, 16.6, 0.03, 0.03, 0, 1.8, '#5a3a28', { seg: 6 }); // coat rack
  b.deco(new THREE.SphereGeometry(0.25, 10, 8), mat('#a33'), 15.6, 1.55, 16.6).scale.set(1, 1.4, 0.6);
  wallFrame(b, 12.02, 1.6, 2.5, Math.PI / 2); wallFrame(b, 15.98, 1.6, 9.5, -Math.PI / 2);

  // ---- kitchen (x 17-23, z 1-9)
  const mint = mat('#a8d5ba');
  b.box(17.0, 23.0, 1.0, 1.65, 0, 0.86, mint);
  b.vbox(17.0, 23.0, 1.0, 1.7, 0.86, 0.92, mat('#f4efe2', { roughness: 0.4 }));
  physics.boxes[physics.boxes.length - 1].top = 0.92;
  b.vbox(19.1, 20.3, 1.05, 1.68, 0.925, 0.935, mat('#2a2a2a')); // stovetop
  const kettle = b.deco(new THREE.SphereGeometry(0.13, 14, 10), mat('#e63946', { roughness: 0.3 }), 19.4, 1.05, 1.35);
  kettle.scale.y = 0.85;
  b.box(22.1, 22.98, 1.7, 2.6, 0, 1.8, mat('#f2ead3', { roughness: 0.35 })); // round-shouldered fridge
  b.table(18.2, 20.0, 4.6, 6.0, 0.76, '#e9c46a', 0.05); // laminex table
  for (const [x, z, f] of [[18.7, 4.15, 0], [19.6, 4.15, 0], [18.7, 6.45, Math.PI], [19.6, 6.45, Math.PI]]) b.chair(x, z, f, '#c0c0c0');
  b.box(21.6, 22.6, 6.5, 7.2, 0.7, 0.75, mat('#d4af37', { metalness: 0.6 }), { colliderBottom: 0 }); // tea trolley
  b.cyl(17.6, 7.8, 0.14, 0.12, 0, 0.32, '#e8b923'); // Princess's food bowl
  b.deco(new THREE.TorusGeometry(0.11, 0.03, 6, 16), mat('#ff8fab'), 17.6, 0.33, 7.8).rotation.x = Math.PI / 2;

  // ---- dining room (x 17-23, z 10-17)
  b.table(18.0, 21.6, 11.6, 13.4, 0.76, '#6b4423');
  b.vbox(17.85, 21.75, 11.45, 13.55, 0.76, 0.77, cream); // lace tablecloth
  b.vbox(17.85, 21.75, 11.45, 11.46, 0.5, 0.77, cream);
  b.vbox(17.85, 21.75, 13.54, 13.55, 0.5, 0.77, cream);
  for (const [x, z, f] of [[18.8, 11.15, 0], [20.8, 11.15, 0], [18.8, 13.85, Math.PI], [20.8, 13.85, Math.PI]]) b.chair(x, z, f, '#4a2e17');
  b.cyl(19.8, 12.5, 0.05, 0.08, 0.77, 1.15, mat('#d4af37', { metalness: 0.7 }), { collide: false, seg: 8 }); // candlestick
  b.box(17.02, 17.6, 14.0, 16.6, 0, 0.9, darkWood); // sideboard
  wallFrame(b, 20, 1.7, 16.98, Math.PI, 0.5, 0.35);

  // ---- conservatory (x 1-11, z 11-17)
  b.box(3.4, 7.6, 16.15, 16.95, 0, 0.5, mat('#f4efe2')); // window seat (nap spot)
  b.box(3.45, 7.55, 16.2, 16.9, 0.5, 0.56, mat('#f4a261'), { colliderBottom: 0 });
  const glow = b.deco(new THREE.CircleGeometry(1.4, 24), new THREE.MeshBasicMaterial({ color: '#fff3c9', transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending }), 5.5, 0.02, 15.9);
  glow.rotation.x = -Math.PI / 2;
  glow.scale.set(1.6, 0.6, 1);
  for (const [x, z, s, c] of [[1.6, 11.6, 0.9, '#c06030'], [10.3, 11.6, 1.0, '#3f6fb5'], [1.6, 16.3, 0.8, '#c06030'], [10.3, 16.3, 0.9, '#b5651d'], [9.4, 12.0, 0.6, '#ff8fab']]) b.plant(x, z, c, s);
  b.box(3.0, 4.0, 12.0, 13.0, 0, 0.45, mat('#c9a66b')); // wicker chairs
  b.box(6.6, 7.6, 12.0, 13.0, 0, 0.45, mat('#c9a66b'));
  b.table(4.7, 5.9, 12.1, 12.9, 0.55, '#f0f0f0', 0.04);

  // ================================================================ UPSTAIRS
  // ---- Grandma's bedroom (x 1-11, z 1-10)
  b.box(2.0, 5.5, 1.02, 3.6, UP, UP + 0.6, mat('#f0ece4'));
  b.vbox(1.95, 5.55, 1.5, 3.65, UP + 0.6, UP + 0.63, crochet); // patchwork quilt
  b.box(1.95, 5.55, 1.0, 1.15, UP, UP + 1.25, darkWood); // headboard
  b.vbox(2.4, 3.5, 1.2, 1.7, UP + 0.6, UP + 0.72, cream);
  b.vbox(4.0, 5.1, 1.2, 1.7, UP + 0.6, UP + 0.72, cream);
  b.box(5.6, 6.3, 1.02, 1.6, UP, UP + 0.55, wood); // bedside table
  b.cyl(6.1, 1.25, 0.04, 0.045, UP + 0.55, UP + 0.68, new THREE.MeshStandardMaterial({ color: '#cfe9ff', transparent: true, opacity: 0.5 }), { collide: false, seg: 10 }); // dentures glass
  b.box(8.0, 10.4, 1.02, 1.6, UP, UP + 0.85, wood); // dresser
  b.deco(new THREE.CircleGeometry(0.45, 24), mat('#dfeaf2', { metalness: 0.1, roughness: 0.1, emissive: '#8fa7c4', emissiveIntensity: 0.25 }), 9.2, UP + 1.45, 1.05);
  b.box(10.3, 10.95, 6.0, 8.6, UP, UP + 2.0, darkWood); // wardrobe
  b.rug(3.0, 8.5, 4.5, 8.5, '#c77dff', '#f4e1ea');
  for (const s of [-1, 1]) b.deco(new THREE.SphereGeometry(0.1, 10, 8), mat('#ff8fab'), 3.5 + s * 0.15, UP + 0.05, 4.1).scale.set(1, 0.5, 1.8); // fluffy slippers
  wallFrame(b, 3.75, UP + 1.6, 1.02, 0, 0.6, 0.4);

  // ---- craft room (x 1-11, z 11-17)
  b.box(1.0, 1.5, 11.4, 15.6, UP, UP + 1.6, wood); // yarn shelves
  for (let i = 0; i < 18; i++) b.deco(new THREE.SphereGeometry(0.11, 10, 8), mat(['#e63946', '#4cc9f0', '#ffd166', '#9b5de5', '#06d6a0', '#ff8fab'][i % 6]), 1.5, UP + 0.4 + Math.floor(i / 6) * 0.45, 11.8 + (i % 6) * 0.65);
  b.box(5.6, 6.4, 13.6, 14.4, UP, UP + 0.45, wood); // Grandpa's rocking chair
  b.vbox(5.2, 5.6, 13.6, 14.4, UP + 0.45, UP + 1.05, wood);
  b.box(8.5, 10.5, 16.2, 16.95, UP, UP + 0.75, wood); // sewing table
  b.box(9.0, 9.8, 16.35, 16.8, UP + 0.75, UP + 1.0, mat('#1d1d1d')); // sewing machine
  b.cyl(3.5, 12.0, 0.05, 0.05, UP, UP + 1.1, '#5a3a28', { seg: 6 }); // dress form
  b.deco(new THREE.SphereGeometry(0.22, 12, 10), mat('#d9c7b8'), 3.5, UP + 1.35, 12.0).scale.set(1, 1.4, 0.7);
  b.rug(3.0, 8.0, 12.0, 16.0, '#7d8f69', '#f2e8cf');

  // ---- landing (x 12-16)
  b.plant(12.5, 1.5, '#c06030', 0.8);
  b.box(15.4, 15.98, 1.2, 2.6, UP, UP + 0.8, wood); // hall stand
  wallFrame(b, 12.02, UP + 1.6, 14.0, Math.PI / 2);

  // ---- pink bathroom (x 17-23, z 1-8)
  b.box(18.0, 20.5, 1.05, 2.4, UP, UP + 0.55, mat('#ffffff', { roughness: 0.2 })); // clawfoot bath
  b.vbox(18.15, 20.35, 1.2, 2.25, UP + 0.553, UP + 0.556, mat('#9fd3e6', { roughness: 0.1 }));
  b.box(21.6, 22.4, 1.02, 1.3, UP, UP + 0.8, mat('#ffd6e0'));
  b.box(21.7, 22.3, 1.3, 1.85, UP, UP + 0.42, mat('#ffd6e0'));
  const doll = b.deco(new THREE.ConeGeometry(0.14, 0.32, 14), mat('#ff8fab'), 22.0, UP + 0.98, 1.16); // crocheted toilet-roll doll
  void doll;
  b.deco(new THREE.SphereGeometry(0.06, 10, 8), mat('#f1d3b3'), 22.0, UP + 1.18, 1.16);
  b.box(22.4, 22.98, 4.0, 5.2, UP, UP + 0.85, mat('#ffffff')); // basin
  b.rug(18.0, 20.5, 2.6, 3.6, '#ff8fab', '#ffd6e0');

  // ---- spare room (x 17-23, z 9-17)
  b.box(17.2, 19.0, 14.8, 16.95, UP, UP + 0.55, mat('#e6e9f2'));
  b.vbox(17.15, 19.05, 14.8, 16.2, UP + 0.55, UP + 0.58, crochet);
  b.box(20.5, 22.0, 9.2, 10.0, UP, UP + 0.5, mat('#7a4b2a')); // old trunk
  b.box(21.8, 22.95, 16.0, 16.95, UP, UP + 0.45, mat('#c49a6c')); // boxes
  b.box(22.0, 22.9, 16.1, 16.85, UP + 0.45, UP + 0.85, mat('#b5895f'));
  b.box(17.1, 17.5, 10.0, 12.5, UP, UP + 1.6, wood); // doll shelf
  for (let i = 0; i < 4; i++) {
    b.deco(new THREE.SphereGeometry(0.07, 10, 8), mat('#f5d0b5'), 17.3, UP + 1.68, 10.3 + i * 0.6);
    b.deco(new THREE.ConeGeometry(0.09, 0.2, 10), mat(['#e63946', '#4cc9f0', '#9b5de5', '#ffd166'][i]), 17.3, UP + 1.6 + 0.0, 10.3 + i * 0.6);
  }

  // ================================================================ LIGHTING
  scene.add(new THREE.HemisphereLight('#fff6e6', '#8a6a50', 1.0));
  for (const [x, z] of [[6, 5.5], [14, 8], [20, 5], [20, 13.5], [6, 14]]) light(scene, b, x, 2.45, z, '#ffe9c7', 7, 8);
  for (const [x, z] of [[6, 5.5], [14, 8], [20, 4.5], [20, 13], [6, 14]]) light(scene, b, x, UP + 2.2, z, '#fff1d6', 6, 8);
  const fireLight = new THREE.PointLight('#ff8a3a', 4, 5, 1.6);
  fireLight.position.set(1.9, 0.5, 5.0);
  scene.add(fireLight);
  const sunLight = new THREE.PointLight('#ffd27a', 6, 6, 1.5);
  sunLight.position.set(5.5, 1.6, 16.0);
  scene.add(sunLight);

  return {
    update(dt, time) {
      pendulum.rotation.x = Math.sin(time * 2.4) * 0.25;
      const flick = 0.9 + Math.sin(time * 17) * 0.15 + Math.random() * 0.15;
      fireLight.intensity = 4 * flick;
      fire.material.emissiveIntensity = flick;
    },
    start: { x: 14.0, z: 14.8, yaw: Math.PI },
    rats: [
      { x: 6.5, z: 7.4, type: 'mouse' }, { x: 21.5, z: 3.5, type: 'mouse' }, { x: 17.8, z: 7.0, type: 'mouse' },
      { x: 21.8, z: 15.8, type: 'mouse' }, { x: 2.0, z: 15.4 }, { x: 22.2, z: 8.3 },
      { x: 7.0, z: 6.0, type: 'mouse', y: UP }, { x: 4.0, z: 13.0, type: 'mouse', y: UP },
      { x: 19.0, z: 11.0, type: 'mouse', y: UP }, { x: 21.5, z: 14.6, type: 'mouse', y: UP },
    ],
    birds: [
      { x: 4.5, z: 7.8, type: 'budgie' }, { x: 6.0, z: 14.0, type: 'budgie' },
      { x: 6.0, z: 5.5, type: 'budgie', y: UP }, { x: 5.0, z: 14.0, type: 'budgie', y: UP }, { x: 13.8, z: 2.4, type: 'budgie', y: UP },
    ],
    dogs: [
      {
        name: 'Princess', size: 0.55, reach: 0.45, speed: 5.2, bite: 12,
        coat: { main: '#e3c08f', dark: '#8a6a4a', light: '#f5e6cf' },
        x: 12.5, z: 15.5,
        waypoints: [
          [12.5, 15.5, 1], [12.5, 2.5, 1], [11.5, 5.5, 0], [6.0, 6.3, 2], [11.5, 5.5, 0], [15.5, 4.5, 0],
          [18.5, 3.6, 1], [19.5, 8.0, 0], [19.5, 15.6, 2], [16.5, 13.5, 0], [12.5, 13.5, 0], [11.5, 14.5, 0],
          [6.0, 14.2, 2], [11.5, 14.5, 0],
        ],
      },
    ],
    roombas: [{ x: 20.5, z: 15.6, yaw: 1.2 }],
    humans: [
      { name: 'Grandma', x: 19.6, z: 2.35, yaw: Math.PI, pose: 'stand', shirt: '#b56576', hair: '#e0e0e0', skin: '#f1d3b3', pants: '#6d597a' },
      { name: 'Doris', x: 8.4, z: 2.0, yaw: 0, pose: 'sit', shirt: '#6d597a', hair: '#c9c9ff', skin: '#f5d0b5', pants: '#4a4a6a', noSeat: true },
      { name: 'Grandpa Ron', x: 6.0, z: 14.0, y: UP, yaw: Math.PI / 2, pose: 'sit', shirt: '#7d8f69', hair: '#bbbbbb', skin: '#e0ac69', pants: '#5a4a3a', noSeat: true },
    ],
    pickups: [
      ['toy', 14.5, 2.0], ['toy', 9.6, 6.6], ['toy', 21.0, 7.6], ['toy', 2.5, 12.0],
      ['toy', 12.5, 13.0, UP], ['toy', 18.0, 9.6, UP], ['toy', 21.5, 5.5, UP],
      ['fish', 21.8, 11.0], ['fish', 9.5, 8.5, UP],
    ],
    yarn: [[19.8, 12.5], [1.6, 9.2], [8.8, 15.6], [4.4, 2.6, UP + 0.6], [21.4, 15.4, UP]],
    ornaments: [
      ['clock', 1.38, 1.2, 5.0], ['figurine', 1.38, 1.2, 4.0], ['vase', 1.38, 1.2, 6.0], ['teacup', 3.6, 0.45, 4.3],
      ['duck', 10.3, 0.6, 5.45], ['duck', 21.7, 0.92, 1.3], ['teacup', 17.7, 0.92, 1.3], ['teacup', 22.1, 0.75, 6.85],
      ['plate', 17.3, 0.9, 14.5], ['vase', 17.3, 0.9, 15.4], ['teacup', 17.3, 0.9, 16.2],
      ['snowglobe', 15.72, 0.85, 14.6], ['frame', 15.72, 0.85, 15.4],
      ['frame', 5.95, UP + 0.55, 1.3], ['figurine', 8.5, UP + 0.85, 1.3], ['snowglobe', 9.3, UP + 0.85, 1.3], ['clock', 10.0, UP + 0.85, 1.3],
      ['vase', 21.2, UP + 0.5, 9.6], ['teacup', 9.0, UP + 0.75, 16.55], ['figurine', 15.7, UP + 0.8, 1.9],
    ],
    goals: [
      { name: 'the sunny window seat', x: 5.5, z: 16.55, r: 0.7, minY: 0.45, maxY: 0.95 },
      { name: "Grandma's quilted bed", x: 3.75, z: 2.6, r: 0.9, minY: UP + 0.5, maxY: UP + 1.1 },
    ],
  };
}
