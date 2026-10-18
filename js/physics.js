// Tiny collision world: wall cells from the tile grid (infinitely tall) plus
// furniture boxes with a bottom and a top, so cats can jump onto sofas and
// walk under tables. Entities are vertical cylinders (x, z, radius, y, height).

export const GRAVITY = 22;
export const STEP_UP = 0.14;

export class PhysicsWorld {
  constructor(level) {
    this.level = level;
    this.boxes = []; // {minX, maxX, minZ, maxZ, bottom, top, tag}
  }

  addBox(minX, maxX, minZ, maxZ, bottom, top, tag = '') {
    const b = { minX, maxX, minZ, maxZ, bottom, top, tag };
    this.boxes.push(b);
    return b;
  }

  removeBox(b) {
    const i = this.boxes.indexOf(b);
    if (i >= 0) this.boxes.splice(i, 1);
  }

  isWall(cx, cz) {
    return this.level.isWall(cx, cz);
  }

  // Highest surface under (x,z) that the entity at height y can stand on.
  groundHeight(x, z, r, y) {
    let g = 0;
    const rr = r * 0.6; // need a decent chunk of the body over a surface to stand on it
    for (const b of this.boxes) {
      if (x + rr < b.minX || x - rr > b.maxX || z + rr < b.minZ || z - rr > b.maxZ) continue;
      if (b.top <= y + STEP_UP + 0.001 && b.top > g) g = b.top;
    }
    return g;
  }

  // Pushes an entity out of walls and furniture it overlaps. Mutates e.x/e.z.
  resolve(e) {
    for (let iter = 0; iter < 3; iter++) {
      let moved = false;
      // walls
      const x0 = Math.floor(e.x - e.radius), x1 = Math.floor(e.x + e.radius);
      const z0 = Math.floor(e.z - e.radius), z1 = Math.floor(e.z + e.radius);
      for (let cz = z0; cz <= z1; cz++)
        for (let cx = x0; cx <= x1; cx++) {
          if (!this.isWall(cx, cz)) continue;
          if (pushOut(e, cx, cx + 1, cz, cz + 1)) moved = true;
        }
      // furniture
      if (!e.ignoreBoxes) {
        for (const b of this.boxes) {
          if (e.x + e.radius < b.minX || e.x - e.radius > b.maxX || e.z + e.radius < b.minZ || e.z - e.radius > b.maxZ) continue;
          if (e.y + STEP_UP >= b.top) continue; // we're above it
          if (e.y + e.height <= b.bottom) continue; // we're under it
          if (pushOut(e, b.minX, b.maxX, b.minZ, b.maxZ)) moved = true;
        }
      }
      if (!moved) break;
    }
  }

  // Clamp upward motion against undersides of boxes (e.g. jumping under a table).
  ceilingAbove(e) {
    let c = Infinity;
    for (const b of this.boxes) {
      if (e.x + e.radius * 0.5 < b.minX || e.x - e.radius * 0.5 > b.maxX || e.z + e.radius * 0.5 < b.minZ || e.z - e.radius * 0.5 > b.maxZ) continue;
      if (b.bottom >= e.y + e.height - 0.05 && b.bottom < c) c = b.bottom;
    }
    return c;
  }

  // Grid line-of-sight between two XZ points (walls only).
  lineOfSight(ax, az, bx, bz) {
    const dx = bx - ax, dz = bz - az;
    const dist = Math.hypot(dx, dz);
    const steps = Math.ceil(dist / 0.25);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (this.isWall(Math.floor(ax + dx * t), Math.floor(az + dz * t))) return false;
    }
    return true;
  }

  // Point inside any solid (used for projectiles). Returns surface info or null.
  pointSolid(x, y, z) {
    if (y <= 0) return 'floor';
    if (this.isWall(Math.floor(x), Math.floor(z))) return 'wall';
    for (const b of this.boxes) {
      if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ && y >= b.bottom && y <= b.top) return 'box';
    }
    return null;
  }
}

function pushOut(e, minX, maxX, minZ, maxZ) {
  const px = Math.max(minX, Math.min(e.x, maxX));
  const pz = Math.max(minZ, Math.min(e.z, maxZ));
  let dx = e.x - px, dz = e.z - pz;
  const d2 = dx * dx + dz * dz;
  if (d2 >= e.radius * e.radius) return false;
  if (d2 > 1e-8) {
    const d = Math.sqrt(d2);
    const push = e.radius - d;
    e.x += (dx / d) * push;
    e.z += (dz / d) * push;
  } else {
    // centre inside the box: leave along the shortest axis
    const l = e.x - minX, r = maxX - e.x, t = e.z - minZ, b = maxZ - e.z;
    const m = Math.min(l, r, t, b);
    if (m === l) e.x = minX - e.radius;
    else if (m === r) e.x = maxX + e.radius;
    else if (m === t) e.z = minZ - e.radius;
    else e.z = maxZ + e.radius;
  }
  return true;
}
