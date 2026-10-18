// Wolfenstein-style tile map. One tile = 1 metre. x grows east, z grows south.
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

const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIRS8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

export class Level {
  constructor(rows) {
    this.rows = rows;
    this.h = rows.length;
    this.w = rows[0].length;
    this.blocked = {}; // nav profile name -> Uint8Array
    this.fieldCache = new Map();
  }

  cell(cx, cz) {
    if (cx < 0 || cz < 0 || cx >= this.w || cz >= this.h) return '#';
    return this.rows[cz][cx];
  }

  isWall(cx, cz) {
    const c = this.cell(cx, cz);
    return c === '#' || c === 'G';
  }

  // Room letter for a tile; doorways borrow the hallway look.
  roomOf(cx, cz) {
    const c = this.cell(cx, cz);
    if (c === 'd') return 'H';
    if (c === '#' || c === 'G') return null;
    return c;
  }

  roomAt(x, z) {
    return this.roomOf(Math.floor(x), Math.floor(z));
  }

  // Build a nav-blocking grid for creatures of a given height (furniture lower than
  // the creature's height that sits on the floor blocks it; tables it fits under don't).
  buildNav(profile, height, boxes) {
    const g = new Uint8Array(this.w * this.h);
    for (let z = 0; z < this.h; z++)
      for (let x = 0; x < this.w; x++) if (this.isWall(x, z)) g[z * this.w + x] = 1;
    for (const b of boxes) {
      if (b.top <= 0.15 || b.bottom >= height) continue;
      for (let z = Math.floor(b.minZ); z <= Math.floor(b.maxZ); z++)
        for (let x = Math.floor(b.minX); x <= Math.floor(b.maxX); x++) {
          // only block if the box covers the middle of the tile
          if (b.maxX > x + 0.3 && b.minX < x + 0.7 && b.maxZ > z + 0.3 && b.minZ < z + 0.7) {
            if (x >= 0 && z >= 0 && x < this.w && z < this.h) g[z * this.w + x] = 1;
          }
        }
    }
    this.blocked[profile] = g;
    this.fieldCache.clear();
  }

  walkable(profile, cx, cz) {
    if (cx < 0 || cz < 0 || cx >= this.w || cz >= this.h) return false;
    return !this.blocked[profile][cz * this.w + cx];
  }

  // BFS distance field towards a target tile (cached).
  field(profile, tx, tz) {
    const key = profile + ':' + tx + ',' + tz;
    let f = this.fieldCache.get(key);
    if (f) return f;
    f = new Int16Array(this.w * this.h).fill(-1);
    if (tx >= 0 && tz >= 0 && tx < this.w && tz < this.h) {
      const q = [tx, tz];
      f[tz * this.w + tx] = 0;
      for (let i = 0; i < q.length; i += 2) {
        const x = q[i], z = q[i + 1];
        const d = f[z * this.w + x];
        for (const [dx, dz] of DIRS4) {
          const nx = x + dx, nz = z + dz;
          if (!this.walkable(profile, nx, nz)) continue;
          const idx = nz * this.w + nx;
          if (f[idx] !== -1) continue;
          f[idx] = d + 1;
          q.push(nx, nz);
        }
      }
    }
    if (this.fieldCache.size > 300) this.fieldCache.clear();
    this.fieldCache.set(key, f);
    return f;
  }

  // Next waypoint (world x,z) for a creature at (x,z) heading to (gx,gz). Returns null if unreachable.
  nextStep(profile, x, z, gx, gz) {
    const tx = Math.floor(gx), tz = Math.floor(gz);
    const cx = Math.floor(x), cz = Math.floor(z);
    if (cx === tx && cz === tz) return { x: gx, z: gz };
    const f = this.field(profile, tx, tz);
    const here = f[cz * this.w + cx];
    let best = null, bestD = here === -1 ? 32767 : here;
    for (const [dx, dz] of DIRS8) {
      const nx = cx + dx, nz = cz + dz;
      if (!this.walkable(profile, nx, nz)) continue;
      if (dx && dz && (!this.walkable(profile, cx + dx, cz) || !this.walkable(profile, cx, cz + dz))) continue;
      const d = f[nz * this.w + nx];
      if (d === -1) continue;
      const score = d + (dx && dz ? 0.4 : 0);
      if (score < bestD) { bestD = score; best = [nx, nz]; }
    }
    if (!best) return here === -1 ? null : { x: gx, z: gz };
    return { x: best[0] + 0.5, z: best[1] + 0.5 };
  }

  randomWalkableInRoom(profile, room) {
    for (let i = 0; i < 60; i++) {
      const x = (Math.random() * this.w) | 0, z = (Math.random() * this.h) | 0;
      if (this.cell(x, z) === room && this.walkable(profile, x, z)) return { x: x + 0.5, z: z + 0.5 };
    }
    return null;
  }
}
