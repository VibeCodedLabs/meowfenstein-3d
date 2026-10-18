// Humans, pickups, squeaky-toy projectiles, particles and the Nyan rainbow.
import * as THREE from 'three';
import { makeHuman, makeFish, makeDuck } from '../models/creatures.js';
import { GRAVITY } from '../physics.js';

// ------------------------------------------------------------------ HUMAN
export class Human {
  constructor(game, def) {
    this.game = game;
    this.name = def.name;
    this.x = def.x; this.z = def.z; this.yaw = def.yaw;
    this.cooldown = 0;
    this.model = makeHuman(def);
    this.model.root.position.set(def.x, 0, def.z);
    this.model.root.rotation.y = def.yaw;
    game.scene.add(this.model.root);
    const r = 0.28;
    this.box = game.physics.addBox(def.x - r, def.x + r, def.z - r, def.z + r, 0, this.model.height, 'human');
    this.lookYaw = 0;
  }

  update(dt) {
    this.cooldown -= dt;
    const p = this.game.player;
    const dx = p.x - this.x, dz = p.z - this.z;
    let target = 0;
    if (Math.hypot(dx, dz) < 4) {
      let a = Math.atan2(dx, dz) - this.yaw;
      while (a > Math.PI) a -= Math.PI * 2;
      while (a < -Math.PI) a += Math.PI * 2;
      target = Math.max(-1.1, Math.min(1.1, a));
    }
    this.lookYaw += (target - this.lookYaw) * Math.min(1, dt * 4);
    this.model.update(dt, this.lookYaw);
  }

  get headPos() { return new THREE.Vector3(this.x, this.model.height + 0.25, this.z); }

  dispose() {
    this.game.scene.remove(this.model.root);
    this.game.physics.removeBox(this.box);
  }
}

// ------------------------------------------------------------------ PICKUP
export class Pickup {
  // type: 'fish' | 'toy'; vel: optional thrown velocity
  constructor(game, type, x, y, z, vel = null) {
    this.game = game;
    this.type = type;
    this.x = x; this.y = y; this.z = z;
    this.vel = vel;
    this.radius = 0.12; this.height = 0.2;
    this.t = Math.random() * 10;
    this.model = type === 'fish' ? makeFish() : makeDuck(1.15);
    this.ground = game.physics.groundHeight(x, z, 0.1, y);
    game.scene.add(this.model);
    this.update(0);
  }

  update(dt) {
    this.t += dt;
    const g = this.game;
    if (this.vel) {
      this.vel.y -= GRAVITY * 0.7 * dt;
      this.x += this.vel.x * dt;
      this.z += this.vel.z * dt;
      this.y += this.vel.y * dt;
      g.physics.resolve(this);
      this.ground = g.physics.groundHeight(this.x, this.z, 0.1, this.y);
      if (this.y <= this.ground && this.vel.y < 0) { this.y = this.ground; this.vel = null; }
    }
    const hover = this.vel ? 0 : 0.18 + Math.sin(this.t * 3) * 0.05;
    this.model.position.set(this.x, Math.max(this.y, this.ground) + hover, this.z);
    this.model.rotation.y = this.t * 2;
  }

  dispose() { this.game.scene.remove(this.model); }
}

// ------------------------------------------------------------------ SQUEAKY TOY PROJECTILE
export class ToyProjectile {
  constructor(game, x, y, z, vx, vy, vz) {
    this.game = game;
    this.pos = new THREE.Vector3(x, y, z);
    this.vel = new THREE.Vector3(vx, vy, vz);
    this.fuse = 2.2;
    this.model = makeDuck(1.2);
    game.scene.add(this.model);
    this.spin = new THREE.Vector3(Math.random() * 10, Math.random() * 10, 0);
  }

  // returns false when it should be removed
  update(dt) {
    const g = this.game;
    this.fuse -= dt;
    const prev = this.pos.clone();
    this.vel.y -= 15 * dt;
    this.pos.addScaledVector(this.vel, dt);
    this.model.position.copy(this.pos);
    this.model.rotation.x += this.spin.x * dt;
    this.model.rotation.y += this.spin.y * dt;
    if (this.fuse <= 0 || g.physics.pointSolid(this.pos.x, this.pos.y, this.pos.z)) {
      g.explodeToy(prev);
      return false;
    }
    for (const e of g.enemies) {
      if (e.alive && e.center.distanceTo(this.pos) < 0.75) {
        g.explodeToy(this.pos);
        return false;
      }
    }
    return true;
  }

  dispose() { this.game.scene.remove(this.model); }
}

// ------------------------------------------------------------------ PARTICLES
export class Particles {
  constructor(scene, max = 1500) {
    this.max = max;
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.drag = new Float32Array(max);
    this.grav = new Float32Array(max);
    this.next = 0;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.geo = geo;
    for (let i = 0; i < max; i++) this.pos[i * 3 + 1] = -100;
    this.points = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.08, vertexColors: true, sizeAttenuation: true }));
    this.points.frustumCulled = false;
    scene.add(this.points);
    this.tmp = new THREE.Color();
  }

  emit(x, y, z, vx, vy, vz, color, life, grav = 9, drag = 1.5) {
    const i = this.next;
    this.next = (this.next + 1) % this.max;
    this.pos.set([x, y, z], i * 3);
    this.vel.set([vx, vy, vz], i * 3);
    this.tmp.set(color);
    this.col.set([this.tmp.r, this.tmp.g, this.tmp.b], i * 3);
    this.life[i] = life;
    this.grav[i] = grav;
    this.drag[i] = drag;
  }

  burst(center, count, colors, speed = 3, size = 0.08, life = 1.0, grav = 9) {
    for (let n = 0; n < count; n++) {
      const th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * 2 - 1);
      const s = speed * (0.4 + Math.random() * 0.6);
      this.emit(center.x, center.y, center.z,
        Math.sin(ph) * Math.cos(th) * s, Math.abs(Math.cos(ph)) * s * 0.9 + 1, Math.sin(ph) * Math.sin(th) * s,
        colors[(Math.random() * colors.length) | 0], life * (0.6 + Math.random() * 0.6), grav);
    }
  }

  update(dt) {
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      const k = i * 3;
      if (this.life[i] <= 0) { this.pos[k + 1] = -100; continue; }
      const d = Math.max(0, 1 - this.drag[i] * dt);
      this.vel[k] *= d; this.vel[k + 2] *= d;
      this.vel[k + 1] = this.vel[k + 1] * d - this.grav[i] * dt;
      this.pos[k] += this.vel[k] * dt;
      this.pos[k + 1] += this.vel[k + 1] * dt;
      this.pos[k + 2] += this.vel[k + 2] * dt;
      if (this.pos[k + 1] < 0.02) { this.pos[k + 1] = 0.02; this.vel[k + 1] *= -0.3; this.vel[k] *= 0.6; this.vel[k + 2] *= 0.6; }
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
  }

  clear() {
    this.life.fill(0);
    for (let i = 0; i < this.max; i++) this.pos[i * 3 + 1] = -100;
    this.geo.attributes.position.needsUpdate = true;
  }
}

// ------------------------------------------------------------------ RAINBOW TRAIL
export const RAINBOW = ['#ff1a40', '#ff9a1a', '#ffe81a', '#33dd33', '#1a9cff', '#7a3cff'];

export class RainbowTrail {
  constructor(scene, samples = 70) {
    this.n = samples;
    this.points = []; // {x,y,z,lx,lz,t}
    const verts = samples * 2 * RAINBOW.length;
    this.pos = new Float32Array(verts * 3);
    this.col = new Float32Array(verts * 4);
    const idx = [];
    for (let s = 0; s < RAINBOW.length; s++)
      for (let i = 0; i < samples - 1; i++) {
        const a = (s * samples + i) * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 4));
    geo.setIndex(idx);
    this.geo = geo;
    this.mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 3;
    scene.add(this.mesh);
    this.colors = RAINBOW.map((c) => new THREE.Color(c));
    this.active = false;
  }

  push(x, y, z, yaw, time) {
    this.points.unshift({ x, y, z, lx: Math.cos(yaw), lz: -Math.sin(yaw), t: time });
    if (this.points.length > this.n) this.points.length = this.n;
  }

  update(time) {
    const W = 0.62, band = W / RAINBOW.length;
    const life = 1.6;
    let v = 0;
    for (let s = 0; s < RAINBOW.length; s++) {
      const c = this.colors[s];
      for (let i = 0; i < this.n; i++) {
        const p = this.points[Math.min(i, this.points.length - 1)];
        for (let side = 0; side < 2; side++) {
          const k = v * 3, kc = v * 4;
          if (p) {
            const off = -W / 2 + band * (s + side);
            const wob = Math.sin(time * 10 + i * 0.5) * 0.02;
            this.pos[k] = p.x + p.lx * off;
            this.pos[k + 1] = p.y + 0.22 + wob;
            this.pos[k + 2] = p.z + p.lz * off;
            const age = time - p.t;
            this.col[kc] = c.r; this.col[kc + 1] = c.g; this.col[kc + 2] = c.b;
            this.col[kc + 3] = i < this.points.length ? Math.max(0, 1 - age / life) * 0.9 : 0;
          } else {
            this.pos[k + 1] = -50;
            this.col[kc + 3] = 0;
          }
          v++;
        }
      }
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
  }

  clear() {
    this.points = [];
    this.update(0);
  }
}
