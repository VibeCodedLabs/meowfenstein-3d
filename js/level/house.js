// Level 1: The House. Furniture, lights, spawns and nap spots.
import * as THREE from 'three';
import { Builder, mat, WALL_H } from './builder.js';
import * as TX from '../textures.js';

// Tile legend:
//   #  wall          G  window (wall with glass)     d  doorway
//   L  lounge room   K  kitchen & dining   H hallway   U laundry
//   W  bathroom      B  bedroom            S study     R sunroom
export const HOUSE_MAP = [
  '###GGG##GGG#################GGG###',
  '#KKKKKKKKKKKK#UUUUU#WWWWW#BBBBBBB#',
  '#KKKKKKKKKKKK#UUUUU#WWWWW#BBBBBBB#',
  '#KKKKKKKKKKKK#UUUUU#WWWWW#BBBBBBB#',
  '#KKKKKKKKKKKK#UUUUU#WWWWW#BBBBBBB#',
  '#KKKKKKKKKKKK#UUUUU#WWWWW#BBBBBBB#',
  '#KKKKKKKKKKKK#UUUUU#WWWWW#BBBBBBB#',
  '#KKKKKKKKKKKK#UUUUU#WWWWW#BBBBBBB#',
  '#KKKKKKKKKKKK#UUUUU#WWWWW#BBBBBBB#',
  '#KKKKKKKKKKKK#UUUUU#WWWWW#BBBBBBB#',
  '#KKKKKKKKKKKK###d#####d######d####',
  '#KKKKKKKKKKKK#HHHHHHHHHHHHHHHHHHH#',
  '#KKKKKKKKKKKKdHHHHHHHHHHHHHHHHHHH#',
  '#KKKKKKKKKKKK#HHHHHHHHHHHHHHHHHHH#',
  '####LLLLLL####d####d########d#####',
  '#LLLLLLLLLLLLLL#SSSSSSSS#RRRRRRRR#',
  '#LLLLLLLLLLLLLL#SSSSSSSS#RRRRRRRRG',
  '#LLLLLLLLLLLLLL#SSSSSSSS#RRRRRRRRG',
  'GLLLLLLLLLLLLLL#SSSSSSSS#RRRRRRRRG',
  'GLLLLLLLLLLLLLL#SSSSSSSS#RRRRRRRRG',
  'GLLLLLLLLLLLLLL#SSSSSSSS#RRRRRRRRG',
  '#LLLLLLLLLLLLLL#SSSSSSSS#RRRRRRRRG',
  '#LLLLLLLLLLLLLL#SSSSSSSS#RRRRRRRRG',
  '#LLLLLLLLLLLLLL#SSSSSSSS#RRRRRRRRG',
  '#LLLLLLLLLLLLLL#SSSSSSSS#RRRRRRRR#',
  '###GGG###GGG#############GGGGGGGG#',
];

export const ROOMS = {
  L: { name: 'Lounge Room', floor: 'wood', floorColor: '#a8703f', wall: '#ead8b4', wallStyle: 'stripes' },
  K: { name: 'Kitchen & Dining', floor: 'tile', floorColor: ['#efe9df', '#d6ccbc'], wall: '#f3ecd2', wallStyle: 'tiles', wallAccent: '#cfe3df' },
  H: { name: 'Hallway', floor: 'wood', floorColor: '#8a5a33', wall: '#d9c9a6', wallStyle: 'diamond' },
  U: { name: 'Laundry', floor: 'tile', floorColor: ['#d9d9d9', '#bdbdbd'], wall: '#e8e8de', wallStyle: 'tiles', wallAccent: '#d0d0c4' },
  W: { name: 'Bathroom', floor: 'tile', floorColor: ['#ffffff', '#cde3ea'], wall: '#e6f2f5', wallStyle: 'tiles', wallAccent: '#b9dbe5' },
  B: { name: 'Bedroom', floor: 'carpet', floorColor: '#8b93b8', wall: '#d9e1ef', wallStyle: 'dots' },
  S: { name: 'Study', floor: 'wood', floorColor: '#6e4a2c', wall: '#cfe0c8', wallStyle: 'stripes' },
  R: { name: 'Sunroom', floor: 'wood', floorColor: '#c99a62', wall: '#fff0cc', wallStyle: 'stripes', sunny: true },
};

export const HOUSE = {
  id: 'house',
  number: 1,
  name: 'The House',
  map: HOUSE_MAP,
  walls: '#G',
  doorRoom: 'H',
  rooms: ROOMS,
  wallStyles: { '#': { kind: 'wallpaper', h: WALL_H }, G: { kind: 'window', h: WALL_H } },
  ceiling: true,
  timeLimit: 360, // seconds until sunset
  camMaxY: 2.45,
  flyMaxY: 2.35, // magpies stay under the ceiling
  background: '#2a2030',
  attract: { cx: 8, cz: 20, rx: 4.5, rz: 3.2, y: 1.7, look: [7.8, 0.5, 21.5], cat: [7.8, 22.2] },
  intro: 'Clear the house of rats and magpies, then find a sunny nap spot.',
  cleared: 'The house is pest-free! Find a sunny nap spot: the cat bed in the Sunroom or the top of the cat tree.',
  clearedText: 'cleared the house',
  build: buildHouse,
};

function buildHouse(scene, physics, level) {
  const b = new Builder(scene, physics, level);
  b.buildStructure(HOUSE);

  // ---------- LOUNGE ROOM ----------
  const couchMat = new THREE.MeshStandardMaterial({ map: TX.fabric('#5a7d9a'), roughness: 1 });
  b.box(6.6, 7.6, 17.5, 21.0, 0, 0.45, couchMat);
  b.box(6.25, 6.6, 17.2, 21.3, 0, 0.92, couchMat);
  b.box(6.6, 7.65, 17.2, 17.5, 0, 0.62, couchMat);
  b.box(6.6, 7.65, 21.0, 21.3, 0, 0.62, couchMat);
  for (const z of [18.35, 20.1]) b.vbox(6.62, 7.5, z - 0.8, z + 0.8, 0.45, 0.52, mat('#6b8fae'));
  b.rug(8.0, 12.4, 17.0, 21.6, '#9b3d3d', '#e2c48a');
  b.box(8.8, 10.2, 18.4, 20.1, 0, 0.44, '#7a5230');
  b.vbox(9.1, 9.5, 19.0, 19.3, 0.44, 0.47, mat('#d9534f')); // magazine
  b.box(14.35, 15.0, 17.6, 20.8, 0, 0.5, '#3d3d3d');
  b.box(14.62, 14.74, 18.0, 20.4, 0.5, 1.28, '#111');
  const screen = b.deco(new THREE.PlaneGeometry(2.3, 0.7), new THREE.MeshStandardMaterial({ color: '#223', emissive: '#4a7bd1', emissiveIntensity: 0.6 }), 14.615, 0.9, 19.2, -Math.PI / 2);
  screen.userData.flicker = true;
  b.box(10.6, 11.8, 22.6, 23.8, 0, 0.45, mat('#8c5a3c'));
  b.box(10.5, 11.9, 23.8, 24.15, 0, 0.98, mat('#7a4b30'));
  b.bookshelf(1.0, 1.42, 15.8, 18.2, 1.8, 'x');
  b.cyl(5.9, 16.3, 0.05, 0.05, 0, 1.55, '#333', { seg: 8 });
  b.deco(new THREE.ConeGeometry(0.28, 0.35, 16, 1, true), new THREE.MeshStandardMaterial({ color: '#fff3d0', emissive: '#ffd27a', emissiveIntensity: 0.6, side: THREE.DoubleSide }), 5.9, 1.6, 16.3);
  b.plant(13.9, 24.2);
  b.plant(4.3, 15.5, '#3f6fb5', 0.8);
  b.box(3.9, 4.6, 20.0, 20.6, 0, 0.4, '#e0a43a'); // toy box
  // Cat tree (nap spot #2) in the south-west corner
  const sisal = mat('#cdb48a');
  const carpetMat = mat('#8f7a66');
  const tiers = [
    [2.4, 3.4, 23.6, 24.6, 0.5],
    [1.05, 2.05, 23.6, 24.6, 1.0],
    [1.05, 2.05, 22.1, 23.1, 1.5],
    [2.35, 3.45, 22.1, 23.1, 2.0],
  ];
  for (const [x0, x1, z0, z1, top] of tiers) {
    b.box(x0, x1, z0, z1, top - 0.07, top, carpetMat, { colliderBottom: 0 });
    b.cyl((x0 + x1) / 2, (z0 + z1) / 2, 0.08, 0.08, 0, top - 0.07, sisal, { collide: false });
  }
  b.cyl(2.2, 23.3, 0.15, 0.15, 0, 1.93, sisal);
  b.box(1.0, 3.6, 21.9, 24.8, 0, 0.06, carpetMat, { collide: false });
  const treeBed = b.deco(new THREE.TorusGeometry(0.36, 0.13, 10, 24), mat('#c56b8b'), 2.9, 2.08, 22.6);
  treeBed.rotation.x = Math.PI / 2;

  // ---------- KITCHEN & DINING ----------
  const benchMat = mat('#f2f0ea');
  const benchTop = mat('#4b4f58', { roughness: 0.4 });
  b.box(1.0, 11.0, 1.0, 1.65, 0, 0.86, benchMat);
  b.vbox(1.0, 11.0, 1.0, 1.7, 0.86, 0.92, benchTop);
  physics.boxes[physics.boxes.length - 1].top = 0.92;
  b.box(1.0, 1.65, 1.65, 6.0, 0, 0.86, benchMat);
  b.vbox(1.0, 1.7, 1.65, 6.0, 0.86, 0.92, benchTop);
  physics.boxes[physics.boxes.length - 1].top = 0.92;
  b.box(12.05, 12.98, 1.0, 1.85, 0, 1.85, mat('#d9dde3', { roughness: 0.3, metalness: 0.2 }));
  b.vbox(12.0, 12.04, 1.1, 1.75, 0.95, 1.6, mat('#888'));
  b.box(4.5, 8.0, 4.0, 5.2, 0, 0.86, mat('#3c6e71'));
  b.vbox(4.45, 8.05, 3.95, 5.25, 0.86, 0.92, benchTop);
  physics.boxes[physics.boxes.length - 1].top = 0.92;
  for (const x of [5.0, 6.25, 7.5]) {
    b.cyl(x, 5.75, 0.19, 0.19, 0.6, 0.66, '#b5651d', { colliderBottom: 0 });
    b.cyl(x, 5.75, 0.03, 0.03, 0, 0.6, '#333', { collide: false, seg: 6 });
  }
  b.table(5.0, 8.5, 8.5, 10.3, 0.76, '#9a6a3a');
  for (const x of [5.8, 7.6]) {
    b.chair(x, 8.05, 0);
    b.chair(x, 10.75, Math.PI);
  }
  b.cyl(2.0, 12.4, 0.2, 0.18, 0, 0.6, '#5b6770'); // bin
  b.plant(12.3, 12.5, '#b5651d', 0.9);
  for (let i = 0; i < 4; i++) b.vbox(2 + i * 2.1, 2.6 + i * 2.1, 1.05, 1.3, 1.5, 1.95, mat('#e6e1d5')); // wall cupboards (visual)

  // ---------- LAUNDRY ----------
  b.box(14.02, 14.88, 1.02, 1.88, 0, 0.9, mat('#f4f4f4', { roughness: 0.4 }));
  b.deco(new THREE.CylinderGeometry(0.27, 0.27, 0.02, 24), mat('#6a8fb0', { roughness: 0.2 }), 14.45, 0.5, 1.89).rotation.x = Math.PI / 2;
  b.box(14.92, 15.8, 1.02, 1.88, 0, 0.9, mat('#f4f4f4', { roughness: 0.4 }));
  b.deco(new THREE.CylinderGeometry(0.27, 0.27, 0.02, 24), mat('#333', { roughness: 0.2 }), 15.36, 0.5, 1.89).rotation.x = Math.PI / 2;
  b.cyl(18.0, 2.4, 0.33, 0.28, 0, 0.45, '#d8c49a');
  b.box(16.5, 18.6, 6.5, 8.2, 0, 0.12, mat('#7d5a50')); // dog bed base
  const dogBedRim = b.deco(new THREE.TorusGeometry(0.75, 0.16, 8, 28), mat('#a9746e'), 17.55, 0.18, 7.35);
  dogBedRim.rotation.x = Math.PI / 2;
  dogBedRim.scale.set(1.3, 1, 1);
  b.cyl(15.2, 9.3, 0.18, 0.15, 0, 0.1, '#c0392b', { collide: false });

  // ---------- BATHROOM ----------
  b.box(20.02, 22.6, 1.02, 2.6, 0, 0.55, mat('#ffffff', { roughness: 0.25 }));
  b.vbox(20.2, 22.4, 1.2, 2.4, 0.553, 0.556, mat('#9fd3e6', { roughness: 0.1 }));
  b.box(23.8, 24.6, 1.02, 1.3, 0, 0.8, mat('#ffffff', { roughness: 0.25 }));
  b.box(23.9, 24.5, 1.3, 1.85, 0, 0.42, mat('#ffffff', { roughness: 0.25 }));
  b.box(24.4, 24.98, 4.0, 5.4, 0, 0.85, mat('#b9a58c'));
  b.rug(21.0, 23.0, 5.5, 7.0, '#5ea3b5', '#e8f4f7');

  // ---------- BEDROOM ----------
  b.box(27.5, 31.0, 1.02, 4.0, 0, 0.58, mat('#f0ece4'));
  b.vbox(27.45, 31.05, 2.4, 4.05, 0.58, 0.6, mat('#5d6fa3'));
  b.box(27.4, 31.1, 1.0, 1.15, 0, 1.1, mat('#6b4b35'));
  b.vbox(27.8, 28.9, 1.25, 1.85, 0.58, 0.7, mat('#ffffff'));
  b.vbox(29.6, 30.7, 1.25, 1.85, 0.58, 0.7, mat('#ffffff'));
  b.box(26.2, 27.2, 1.02, 1.6, 0, 0.55, mat('#6b4b35'));
  b.box(31.3, 32.3, 1.02, 1.6, 0, 0.55, mat('#6b4b35'));
  b.box(32.3, 32.98, 5.0, 8.0, 0, 2.0, mat('#7a5a40'));
  b.box(26.1, 27.4, 6.5, 7.7, 0, 0.45, mat('#b56576'));
  b.box(25.98, 26.25, 6.4, 7.8, 0, 1.0, mat('#a45566'));
  b.rug(27.5, 31.0, 5.0, 8.5, '#e6b8a2', '#8d5a4a');

  // ---------- HALLWAY ----------
  b.box(17.0, 17.6, 11.02, 11.8, 0, 0.25, mat('#333'));
  b.box(17.15, 17.5, 11.1, 11.4, 0.25, 0.32, mat('#a33'), { collide: false });
  b.cyl(21.35, 13.0, 0.36, 0.3, 0, 0.5, '#d8c49a');
  b.box(26.0, 26.8, 11.1, 11.9, 0, 0.6, mat('#c49a6c'));
  b.box(23.5, 25.0, 11.02, 11.47, 0.88, 0.95, mat('#6b4b35'), { colliderBottom: 0 }); // console table
  b.vbox(23.55, 23.6, 11.05, 11.42, 0, 0.88, mat('#6b4b35'));
  b.vbox(24.9, 24.95, 11.05, 11.42, 0, 0.88, mat('#6b4b35'));
  b.box(31.2, 32.1, 11.02, 12.0, 0.48, 0.55, carpetMat, { colliderBottom: 0 });
  b.box(32.1, 32.98, 11.02, 12.0, 1.03, 1.1, carpetMat, { colliderBottom: 0 });
  b.cyl(31.65, 11.5, 0.1, 0.1, 0, 0.48, sisal, { collide: false });
  b.cyl(32.55, 11.5, 0.1, 0.1, 0, 1.03, sisal, { collide: false });
  b.rug(14.3, 32.7, 11.6, 13.4, '#6d597a', '#d6c5a0');

  // ---------- STUDY ----------
  b.box(17.0, 19.6, 24.2, 24.98, 0.7, 0.76, mat('#5c3d24'), { colliderBottom: 0 });
  b.vbox(17.05, 17.15, 24.25, 24.9, 0, 0.7, mat('#5c3d24'));
  b.vbox(19.45, 19.55, 24.25, 24.9, 0, 0.7, mat('#5c3d24'));
  b.vbox(17.9, 18.7, 24.6, 24.7, 0.76, 1.25, mat('#222'));
  b.deco(new THREE.PlaneGeometry(0.72, 0.42), new THREE.MeshStandardMaterial({ color: '#000', emissive: '#7fd6a8', emissiveIntensity: 0.7 }), 18.3, 1.02, 24.59, Math.PI);
  b.bookshelf(23.4, 23.98, 16.0, 20.0, 1.9, '-x');
  b.box(16.02, 16.6, 19.0, 19.8, 0, 0.7, mat('#8a8f99'));
  b.box(20.5, 21.7, 16.5, 17.7, 0, 0.35, mat('#e07a5f'));
  b.rug(17.0, 22.0, 18.0, 22.0, '#3d5a80', '#e0fbfc');
  b.plant(23.4, 24.3, '#e0e0e0', 0.9);

  // ---------- SUNROOM ----------
  b.box(26.0, 27.0, 16.0, 17.0, 0, 0.45, mat('#c9a66b'));
  b.box(26.0, 27.0, 15.75, 16.0, 0, 0.85, mat('#b8955a'));
  b.table(28.5, 29.3, 18.5, 19.3, 0.6, '#f0f0f0', 0.04);
  b.plant(25.6, 24.3, '#8a5a3c', 1.1);
  b.plant(32.3, 15.7, '#8a5a3c', 1.0);
  b.plant(32.3, 24.3, '#c06030', 0.9);
  // the sunny cat bed (nap spot #1)
  b.cyl(30.5, 22.4, 0.55, 0.58, 0, 0.12, mat('#d98c5f'));
  const bedRim = b.deco(new THREE.TorusGeometry(0.52, 0.12, 10, 28), mat('#e8a77d'), 30.5, 0.16, 22.4);
  bedRim.rotation.x = Math.PI / 2;
  b.deco(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 24), mat('#fff3e6'), 30.5, 0.14, 22.4);

  // sunbeam shafts (fake volumetric light)
  const beamMat = new THREE.MeshBasicMaterial({ color: '#ffe8a3', transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const beam = b.deco(new THREE.BoxGeometry(1.5, 3.2, 1.5), beamMat, 31.2, 1.3, 23.4);
  beam.rotation.set(0.45, 0.6, 0.2);
  const pool = b.deco(new THREE.CircleGeometry(1.0, 28), new THREE.MeshBasicMaterial({ color: '#fff0b0', transparent: true, opacity: 0.28, depthWrite: false, blending: THREE.AdditiveBlending }), 30.5, 0.2, 22.4);
  pool.rotation.x = -Math.PI / 2;
  for (const [x, z, r] of [[9, 3.5, 0.7], [4, 3.5, 0.7], [29, 3.0, 0.6], [4.5, 22.5, 0.8], [11, 22.5, 0.8]]) {
    const p = b.deco(new THREE.CircleGeometry(r, 20), new THREE.MeshBasicMaterial({ color: '#fff3c9', transparent: true, opacity: 0.12, depthWrite: false, blending: THREE.AdditiveBlending }), x, 0.01, z);
    p.rotation.x = -Math.PI / 2;
    p.scale.set(1.4, 1, 1);
  }

  // ---------- LIGHTING ----------
  scene.add(new THREE.HemisphereLight('#fff6e6', '#8a6a50', 1.15));
  const sun = new THREE.DirectionalLight('#fff1d6', 0.9);
  sun.position.set(-10, 20, 30);
  scene.add(sun);
  const lamps = [
    [8, 19.5, '#ffe2b0', 9], [7, 6.5, '#fff6e8', 10], [17, 5.5, '#f6f6ff', 6], [22.5, 5.5, '#eef7ff', 6],
    [29.5, 5.5, '#ffe2c4', 8], [23.5, 12.5, '#ffe9c7', 12], [20, 20, '#fff1d6', 8], [29, 20, '#fff2b8', 10],
  ];
  for (const [x, z, color, range] of lamps) {
    b.ceilingLight(x, z, color);
    const pl = new THREE.PointLight(color, 9, range, 1.6);
    pl.position.set(x, WALL_H - 0.3, z);
    scene.add(pl);
  }
  const sunSpot = new THREE.PointLight('#ffd27a', 6, 5, 1.5);
  sunSpot.position.set(30.5, 1.4, 23.2);
  scene.add(sunSpot);

  return {
    update(dt, time) {
      screen.material.emissiveIntensity = 0.45 + Math.sin(time * 13) * 0.1 + Math.random() * 0.15;
    },
    start: { x: 7.8, z: 23.6, yaw: Math.PI },
    rats: [
      { x: 11.5, z: 16.5 }, { x: 3.0, z: 10.0 }, { x: 10.5, z: 7.0 }, { x: 22.5, z: 6.5 },
      { x: 30.0, z: 7.0 }, { x: 20.0, z: 20.5 }, { x: 28.0, z: 21.0 },
      { x: 17.0, z: 4.5 }, { x: 27.5, z: 12.8 }, { x: 22.4, z: 18.6 }, { x: 28.5, z: 8.8 },
    ],
    birds: [
      { x: 10.5, z: 21.5 }, { x: 7.0, z: 7.0 }, { x: 22.0, z: 12.5 }, { x: 29.5, z: 6.0 }, { x: 29.0, z: 19.0 },
    ],
    dog: {
      name: 'Brutus',
      x: 17.5, z: 7.3,
      waypoints: [
        [17.5, 7.3, 3], [16.5, 12.4, 0], [24.0, 12.4, 1.5], [30.3, 12.6, 2], [20.0, 12.4, 0],
        [13.5, 12.5, 0], [10.0, 12.3, 1], [10.0, 7.0, 1.5], [3.0, 7.5, 2], [9.5, 11.8, 0], [16.5, 12.4, 0],
      ],
    },
    humans: [
      { name: 'Mum', x: 6.0, z: 2.15, yaw: 0, pose: 'stand', shirt: '#d1495b', hair: '#5a3825', skin: '#f1c27d' },
      { name: 'Dad', x: 18.3, z: 23.65, yaw: 0, pose: 'sit', shirt: '#3f88c5', hair: '#2b2b2b', skin: '#e0ac69', seat: '#333' },
      { name: 'Nan', x: 26.85, z: 7.1, yaw: Math.PI / 2, pose: 'sit', shirt: '#9b72aa', hair: '#dcdcdc', skin: '#f5d0b5', noSeat: true },
    ],
    pickups: [
      ['toy', 4.4, 17.0], ['toy', 10.5, 12.5], ['toy', 15.6, 5.0], ['toy', 32.0, 9.2], ['toy', 22.5, 22.5],
      ['toy', 21.2, 8.2], ['toy', 19.0, 13.2], ['toy', 31.0, 17.0], ['fish', 2.6, 16.8], ['fish', 31.5, 13.3],
    ],
    goals: [
      { name: 'the sunny cat bed', x: 30.5, z: 22.4, r: 0.6, minY: 0.05, maxY: 0.5 },
      { name: 'the top of the cat tree', x: 2.9, z: 22.6, r: 0.6, minY: 1.9, maxY: 2.5 },
    ],
  };
}
