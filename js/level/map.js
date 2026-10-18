// Wolfenstein-style tile maps. One tile = 1 metre. x grows east, z grows south.
// Each level supplies its own rows, which characters are walls, and which room
// a doorway tile ('d') borrows its look from.

const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIRS8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

export class Level {
  // def: { map: string[], walls: string (wall chars), doorRoom: room letter for 'd' tiles }
  constructor(def) {
    this.rows = def.map;
    this.h = this.rows.length;
    this.w = this.rows[0].length;
    this.wallChars = new Set(def.walls);
    this.doorRoom = def.doorRoom || null;
    this.blocked = {}; // nav profile name -> Uint8Array
    this.fieldCache = new Map();
  }

  cell(cx, cz) {
    if (cx < 0 || cz < 0 || cx >= this.w || cz >= this.h) return '#';
    return this.rows[cz][cx];
  }

  isWallChar(c) {
    return this.wallChars.has(c);
  }

  isWall(cx, cz) {
    return this.wallChars.has(this.cell(cx, cz));
  }

  // Room letter for a tile; doorways borrow the look of doorRoom.
  roomOf(cx, cz) {
    const c = this.cell(cx, cz);
    if (c === 'd') return this.doorRoom;
    if (this.wallChars.has(c)) return null;
    return c;
  }

  roomAt(x, z) {
    return this.roomOf(Math.floor(x), Math.floor(z));
  }

  // Build a nav-blocking grid for creatures of a given height (furniture lower than
  // the creature's height that sits on the floor blocks it; tables it fits under don't).
  // radius: how far a creature's body reaches from the tile centre it walks through.
  buildNav(profile, height, boxes, radius = 0.2) {
    const lo = 0.5 - radius, hi = 0.5 + radius;
    const g = new Uint8Array(this.w * this.h);
    for (let z = 0; z < this.h; z++)
      for (let x = 0; x < this.w; x++) if (this.isWall(x, z)) g[z * this.w + x] = 1;
    for (const b of boxes) {
      if (b.top <= 0.15 || b.bottom >= height) continue;
      for (let z = Math.floor(b.minZ); z <= Math.floor(b.maxZ); z++)
        for (let x = Math.floor(b.minX); x <= Math.floor(b.maxX); x++) {
          // only block if the box covers the middle of the tile
          if (b.maxX > x + lo && b.minX < x + hi && b.maxZ > z + lo && b.minZ < z + hi) {
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