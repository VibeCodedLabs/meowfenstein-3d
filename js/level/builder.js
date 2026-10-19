// Turns a tile map into meshes (floors, walls, optional ceiling) and gives
// furniture helpers that create both a mesh and a matching collider.
//
// Levels describe their look with data:
//   rooms[letter]   = { name, floor: 'wood'|'tile'|'carpet'|'grass'|'gravel'|'soil'|'bark'|'decking'|'pavement'|'sand'|'water', floorColor, ... }
//   wallStyles[ch]  = { kind: 'wallpaper'|'window'|'hedge'|'fence'|'brick'|'brickWindow'|'door'|'railing', h: height, cap: colour }
//   ceiling         = true for indoor levels
import * as THREE from 'three';
import * as TX from '../textures.js';

export const WALL_H = 2.6;

const matCache = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) {
    matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...opts }));
  }
  return matCache.get(key);
}

function floorMaterial(info) {
  const c = info.floorColor;
  const tex = {
    wood: () => TX.woodFloor(c),
    decking: () => TX.decking(c),
    tile: () => TX.tileFloor(c[0], c[1]),
    carpet: () => TX.carpet(c),
    grass: () => TX.grass(c),
    gravel: () => TX.gravel(c),
    soil: () => TX.soil(c),
    bark: () => TX.bark(c),
    pavement: () => TX.pavement(c),
    sand: () => TX.sand(c),
    water: () => TX.pondWater(c),
  }[info.floor]();
  const rough = { tile: 0.45, water: 0.15 }[info.floor] ?? 0.9;
  return new THREE.MeshStandardMaterial({ map: tex, roughness: rough, metalness: info.floor === 'water' ? 0.1 : 0 });
}

// per-room kinds (wallpaper/window) take their colours from the room; the rest are fixed
const PER_ROOM = new Set(['wallpaper', 'window']);

function wallMaterial(style, info) {
  let tex, emissive = null;
  switch (style.kind) {
    case 'wallpaper': tex = TX.wallpaper(info.wall, info.wallStyle, info.wallAccent); break;
    case 'window':
      tex = TX.windowWall(info.wall, !!info.sunny);
      emissive = { color: info.sunny ? '#ffdf8a' : '#9fc8ff', intensity: info.sunny ? 0.55 : 0.3 };
      break;
    case 'hedge': tex = TX.hedge(); break;
    case 'fence': tex = TX.fence(); break;
    case 'brick': tex = TX.brick(false); break;
    case 'brickWindow': tex = TX.brick(true); break;
    case 'door': tex = TX.backDoor(); break;
    case 'railing': tex = TX.railing(); break;
  }
  if (style.kind !== 'wallpaper' && style.kind !== 'window') tex.repeat.set(1, 1);
  const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
  if (style.kind === 'railing') { m.alphaTest = 0.5; m.side = THREE.DoubleSide; m.metalness = 0.4; }
  if (emissive) {
    m.emissive = new THREE.Color(emissive.color);
    m.emissiveMap = tex;
    m.emissiveIntensity = emissive.intensity;
  }
  return m;
}

export class Builder {
  constructor(scene, physics, level) {
    this.scene = scene;
    this.physics = physics;
    this.level = level;
    this.root = new THREE.Group();
    scene.add(this.root);
  }

  // ---------------- structure ----------------
  buildStructure(def) {
    const L = this.level;
    const rooms = def.rooms, styles = def.wallStyles;
    const floors = {}; // room -> positions/uvs
    const walls = {}; // material key -> arrays
    const caps = {}; // wall char -> arrays

    const quad = (bucket, key, pts, uvs, normal) => {
      const b = (bucket[key] ||= { pos: [], uv: [], nrm: [] });
      for (const i of [0, 1, 2, 0, 2, 3]) {
        b.pos.push(...pts[i]);
        b.uv.push(...uvs[i]);
        b.nrm.push(...normal);
      }
    };

    for (let z = 0; z < L.h; z++)
      for (let x = 0; x < L.w; x++) {
        const room = L.roomOf(x, z);
        if (!room) {
          // top cap on outdoor walls that border something walkable
          const c = L.cell(x, z), st = styles[c];
          if (st && st.cap && !def.ceiling) {
            let near = false;
            for (let dz = -1; dz <= 1 && !near; dz++)
              for (let dx = -1; dx <= 1; dx++) if (L.roomOf(x + dx, z + dz)) { near = true; break; }
            if (near) quad(caps, c,
              [[x, st.h, z], [x, st.h, z + 1], [x + 1, st.h, z + 1], [x + 1, st.h, z]],
              [[0, 0], [0, 1], [1, 1], [1, 0]], [0, 1, 0]);
          }
          continue;
        }
        quad(floors, room,
          [[x, 0, z], [x, 0, z + 1], [x + 1, 0, z + 1], [x + 1, 0, z]],
          [[x, -z], [x, -z - 1], [x + 1, -z - 1], [x + 1, -z]], [0, 1, 0]);
        // wall faces looking into this tile (points listed left -> right as seen from the room)
        const sides = [
          { dx: 0, dz: -1, p: [[x, z], [x + 1, z]], n: [0, 0, 1] },
          { dx: 0, dz: 1, p: [[x + 1, z + 1], [x, z + 1]], n: [0, 0, -1] },
          { dx: -1, dz: 0, p: [[x, z + 1], [x, z]], n: [1, 0, 0] },
          { dx: 1, dz: 0, p: [[x + 1, z], [x + 1, z + 1]], n: [-1, 0, 0] },
        ];
        for (const s of sides) {
          const nc = L.cell(x + s.dx, z + s.dz);
          const st = styles[nc];
          if (!st) continue;
          const key = PER_ROOM.has(st.kind) ? nc + room : nc;
          const [a, b] = s.p;
          quad(walls, key,
            [[a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], st.h, b[1]], [a[0], st.h, a[1]]],
            [[0, 0], [1, 0], [1, 1], [0, 1]], s.n);
        }
      }

    const mk = (data, material) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(data.pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(data.uv, 2));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(data.nrm, 3));
      const m = new THREE.Mesh(g, material);
      this.root.add(m);
      return m;
    };

    for (const [room, data] of Object.entries(floors)) mk(data, floorMaterial(rooms[room]));
    for (const [key, data] of Object.entries(walls)) mk(data, wallMaterial(styles[key[0]], rooms[key[1]]));
    for (const [c, data] of Object.entries(caps)) mk(data, mat(styles[c].cap));

    if (!def.ceiling) return;

    // ceiling
    const ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(L.w, L.h),
      new THREE.MeshStandardMaterial({ map: (() => { const t = TX.ceiling(); t.repeat.set(L.w / 2, L.h / 2); return t; })(), roughness: 1 })
    );
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(L.w / 2, WALL_H, L.h / 2);
    this.root.add(ceil);

    // door lintels + frames
    const frameMat = mat('#f7f3ea');
    for (let z = 0; z < L.h; z++)
      for (let x = 0; x < L.w; x++) {
        if (L.cell(x, z) !== 'd') continue;
        const horizontalWalls = L.isWall(x - 1, z) && L.isWall(x + 1, z);
        this.deco(new THREE.BoxGeometry(1, WALL_H - 2.15, 1), mat('#e9e1d2'), x + 0.5, 2.15 + (WALL_H - 2.15) / 2, z + 0.5);
        if (horizontalWalls) {
          this.deco(new THREE.BoxGeometry(0.08, 2.15, 1.04), frameMat, x + 0.04, 1.075, z + 0.5);
          this.deco(new THREE.BoxGeometry(0.08, 2.15, 1.04), frameMat, x + 0.96, 1.075, z + 0.5);
        } else {
          this.deco(new THREE.BoxGeometry(1.04, 2.15, 0.08), frameMat, x + 0.5, 1.075, z + 0.04);
          this.deco(new THREE.BoxGeometry(1.04, 2.15, 0.08), frameMat, x + 0.5, 1.075, z + 0.96);
        }
      }
  }

  // ---------------- helpers ----------------
  deco(geo, material, x, y, z, ry = 0) {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    this.root.add(m);
    return m;
  }

  // Solid box from bottom to top with a collider.
  box(minX, maxX, minZ, maxZ, bottom, top, material, opts = {}) {
    const w = maxX - minX, d = maxZ - minZ, h = top - bottom;
    const m = this.deco(new THREE.BoxGeometry(w, h, d), typeof material === 'string' ? mat(material) : material,
      (minX + maxX) / 2, bottom + h / 2, (minZ + maxZ) / 2);
    if (opts.collide !== false) {
      const cb = opts.colliderBottom ?? bottom;
      this.physics.addBox(minX, maxX, minZ, maxZ, cb, top, opts.tag || '');
    }
    return m;
  }

  // Visual-only box.
  vbox(minX, maxX, minZ, maxZ, bottom, top, material) {
    return this.box(minX, maxX, minZ, maxZ, bottom, top, material, { collide: false });
  }

  cyl(x, z, rTop, rBot, bottom, top, material, opts = {}) {
    const h = top - bottom;
    const m = this.deco(new THREE.CylinderGeometry(rTop, rBot, h, opts.seg || 16), typeof material === 'string' ? mat(material) : material, x, bottom + h / 2, z);
    if (opts.collide !== false) {
      const r = Math.max(rTop, rBot) * 0.85;
      this.physics.addBox(x - r, x + r, z - r, z + r, opts.colliderBottom ?? bottom, top, opts.tag || '');
    }
    return m;
  }

  // Table: slab on legs; creatures shorter than the gap can walk underneath.
  table(minX, maxX, minZ, maxZ, top, color = '#8b5a2b', thick = 0.06) {
    this.box(minX, maxX, minZ, maxZ, top - thick, top, color);
    const legMat = mat(color);
    const lx = [minX + 0.06, maxX - 0.06], lz = [minZ + 0.06, maxZ - 0.06];
    for (const x of lx) for (const z of lz) this.deco(new THREE.BoxGeometry(0.06, top - thick, 0.06), legMat, x, (top - thick) / 2, z);
  }

  chair(x, z, facing, color = '#7a4b25') {
    // seat solid to floor for simplicity (cats hop on chairs)
    const s = 0.22;
    this.box(x - s, x + s, z - s, z + s, 0, 0.46, color);
    const bx = x - Math.sin(facing) * s, bz = z - Math.cos(facing) * s;
    this.deco(new THREE.BoxGeometry(0.44, 0.5, 0.05), mat(color), bx, 0.71, bz, facing);
  }

  plant(x, z, potColor = '#b5651d', size = 1) {
    this.cyl(x, z, 0.22 * size, 0.16 * size, 0, 0.45 * size, potColor);
    const leaf = mat('#3f8f3a');
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const m = this.deco(new THREE.SphereGeometry(0.16 * size, 8, 6), leaf,
        x + Math.cos(a) * 0.14 * size, 0.62 * size + Math.random() * 0.25 * size, z + Math.sin(a) * 0.14 * size);
      m.scale.set(1, 1.5, 0.6);
      m.rotation.y = a;
    }
  }

  rug(minX, maxX, minZ, maxZ, main, border) {
    const tex = TX.rug(main, border);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(maxX - minX, maxZ - minZ), new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }));
    m.rotation.x = -Math.PI / 2;
    m.position.set((minX + maxX) / 2, 0.006, (minZ + maxZ) / 2);
    this.root.add(m);
  }

  bookshelf(minX, maxX, minZ, maxZ, top, facing) {
    this.box(minX, maxX, minZ, maxZ, 0, top, '#5b3a21');
    const tex = TX.books();
    const shelves = Math.floor(top / 0.4);
    for (let i = 0; i < shelves; i++) {
      const y = 0.1 + i * 0.4;
      const w = facing === 'x' ? maxZ - minZ : maxX - minX;
      const g = new THREE.PlaneGeometry(w - 0.08, 0.32);
      const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }));
      if (facing === 'x') { m.rotation.y = Math.PI / 2; m.position.set(maxX + 0.005, y + 0.16, (minZ + maxZ) / 2); }
      else if (facing === '-x') { m.rotation.y = -Math.PI / 2; m.position.set(minX - 0.005, y + 0.16, (minZ + maxZ) / 2); }
      else if (facing === 'z') { m.position.set((minX + maxX) / 2, y + 0.16, maxZ + 0.005); }
      else { m.rotation.y = Math.PI; m.position.set((minX + maxX) / 2, y + 0.16, minZ - 0.005); }
      this.root.add(m);
    }
  }

  ceilingLight(x, z, color = '#fff4dd') {
    const m = this.deco(new THREE.CylinderGeometry(0.28, 0.32, 0.06, 20), new THREE.MeshStandardMaterial({ color: '#fff', emissive: color, emissiveIntensity: 1.2 }), x, WALL_H - 0.03, z);
    return m;
  }
}