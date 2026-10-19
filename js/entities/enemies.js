// Pests: rats that chase and bite; magpies (and pigeons) that circle and swoop.
import * as THREE from 'three';
import { makeRat, makeMagpie, makeBlob } from '../models/creatures.js';
import { sound } from '../audio.js';

function angleTo(fromYaw, dx, dz) {
  const target = Math.atan2(dx, dz);
  let d = target - fromYaw;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function turnToward(e, dx, dz, rate, dt) {
  const d = angleTo(e.yaw, dx, dz);
  e.yaw += Math.max(-rate * dt, Math.min(rate * dt, d));
}

// ------------------------------------------------------------------ RAT
export class Rat {
  // type: 'rat' or 'mouse' (mice are smaller, quicker, 1 hit, nibble softer). y: floor height.
  constructor(game, x, z, type = 'rat', y = 0) {
    this.game = game;
    this.kind = 'rat';
    this.mouse = type === 'mouse';
    this.label = this.mouse ? 'Mouse' : 'Rat';
    this.floor = game.level.floorIndex(y);
    this.baseY = game.level.floorY[this.floor];
    this.x = x; this.z = z; this.y = this.baseY;
    this.yaw = Math.random() * Math.PI * 2;
    this.radius = this.mouse ? 0.1 : 0.14; this.height = 0.2;
    this.hp = this.mouse ? 1 : 2; this.alive = true;
    this.speed = this.mouse ? 4.1 : 3.7;
    this.bite = this.mouse ? 4 : 6;
    this.state = 'wander';
    this.timer = Math.random() * 2;
    this.target = null;
    this.biteCd = 0; this.biteT = 0;
    this.kx = 0; this.kz = 0;
    this.home = game.level.roomAt(x, z, this.baseY);
    this.squeakCd = 0;
    this.deadT = 0;
    this.model = makeRat(this.mouse ? 'mouse' : 'rat');
    this.blob = makeBlob(0.2);
    game.scene.add(this.model.root, this.blob);
  }

  get center() { return new THREE.Vector3(this.x, this.y + 0.1, this.z); }

  update(dt) {
    const g = this.game, p = g.player;
    if (!this.alive) {
      this.deadT += dt;
      this.model.root.rotation.z = Math.min(Math.PI, this.deadT * 10);
      this.model.root.position.y = this.y + 0.15 * Math.sin(Math.min(1, this.deadT * 3) * Math.PI);
      if (this.deadT > 1.2) this.model.root.scale.setScalar(Math.max(0.01, 1 - (this.deadT - 1.2) * 2));
      return this.deadT < 1.7;
    }
    this.biteCd -= dt; this.squeakCd -= dt;
    const dx = p.x - this.x, dz = p.z - this.z, dist = Math.hypot(dx, dz);
    const sameFloor = g.level.floorIndex(p.y) === this.floor;
    const playerReachable = sameFloor && p.y - this.baseY < 0.35 && !p.sleeping;
    let speed = 0, goal = null;

    if (this.state === 'stun') {
      this.timer -= dt;
      if (this.timer <= 0) this.state = 'chase';
    } else if (this.state === 'wander') {
      this.timer -= dt;
      if (!this.target || this.timer <= 0) {
        this.target = g.level.randomWalkableInRoom('small', this.home, this.floor) || { x: this.x, z: this.z };
        this.timer = 2 + Math.random() * 3;
      }
      goal = this.target;
      speed = 1.1;
      const sees = sameFloor && ((dist < 7 && g.physics.lineOfSight(this.x, this.z, p.x, p.z, this.baseY)) || dist < 2.5);
      if (sees && !p.dead && !p.sleeping) {
        this.state = 'chase';
        if (this.squeakCd <= 0) { sound.ratSqueak(); this.squeakCd = 2; }
      }
    } else if (this.state === 'chase') {
      if (dist > 15 || p.sleeping || !sameFloor) { this.state = 'wander'; this.target = null; }
      goal = { x: p.x, z: p.z };
      speed = playerReachable ? this.speed : 1.6;
      if (!playerReachable && dist < 1.2) speed = 0;
      if (playerReachable && dist < 0.9 && this.biteCd <= 0) {
        // rear up and lunge
        this.state = 'bite';
        this.biteT = 0.22;
        sound.ratSqueak();
      }
      if (!playerReachable && this.squeakCd <= 0 && dist < 3) { sound.ratSqueak(); this.squeakCd = 1.5 + Math.random(); }
    } else if (this.state === 'bite') {
      this.biteT -= dt;
      turnToward(this, dx, dz, 14, dt);
      if (dist > 0.3) {
        this.x += Math.sin(this.yaw) * 5 * dt;
        this.z += Math.cos(this.yaw) * 5 * dt;
      }
      if (this.biteT <= 0) {
        if (dist < 0.75 && p.y - this.baseY < 0.45 && sameFloor && p.damage(this.bite, this.x, this.z, 2.5)) g.hud.label(this.mouse ? 'NIBBLE!' : 'CHOMP!', p.labelPos, 'hit', 0.8, 0.6);
        this.biteCd = 1.1;
        this.state = 'chase';
      }
    }

    if (goal && speed > 0) {
      let step = g.level.nextStep('small', this.x, this.z, goal.x, goal.z, this.floor);
      if (dist < 1.5 && this.state === 'chase') step = goal;
      if (step) {
        const sx = step.x - this.x, sz = step.z - this.z, sl = Math.hypot(sx, sz);
        if (sl > 0.05) {
          turnToward(this, sx, sz, 9, dt);
          const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw);
          this.x += fx * speed * dt;
          this.z += fz * speed * dt;
        }
      }
    } else if (this.state === 'chase') {
      turnToward(this, dx, dz, 8, dt);
    }
    this.x += this.kx * dt; this.z += this.kz * dt;
    this.kx *= Math.pow(0.01, dt); this.kz *= Math.pow(0.01, dt);
    g.physics.resolve(this);
    this.y = g.physics.groundHeight(this.x, this.z, this.radius, this.y + 0.15);

    this.model.root.position.set(this.x, this.y, this.z);
    this.model.root.rotation.y = this.yaw;
    this.model.update(dt, speed, { biting: this.state === 'bite' });
    this.blob.position.set(this.x, this.y + 0.01, this.z);
    return true;
  }

  hit(dmg, fromX, fromZ) {
    if (!this.alive) return false;
    this.hp -= dmg;
    const dx = this.x - fromX, dz = this.z - fromZ, d = Math.hypot(dx, dz) || 1;
    this.kx = (dx / d) * 4; this.kz = (dz / d) * 4;
    this.model.fur.emissive.setRGB(0.6, 0, 0);
    setTimeout(() => this.model.fur.emissive.setRGB(0, 0, 0), 120);
    sound.ratSqueak();
    if (this.hp <= 0) {
      this.alive = false;
      this.game.scene.remove(this.blob);
      return true;
    }
    this.state = 'stun';
    this.timer = 0.45;
    return false;
  }

  dispose() { this.game.scene.remove(this.model.root, this.blob); }
}

// ------------------------------------------------------------------ MAGPIE
export class Magpie {
  // type: 'magpie', 'pigeon' (lower, swoops more often, pecks softer) or 'budgie'
  // (tiny and quick, barely hurts). y: floor height on multi-storey levels.
  constructor(game, x, z, type = 'magpie', y = 0) {
    this.game = game;
    this.kind = 'bird';
    this.type = ['pigeon', 'budgie'].includes(type) ? type : 'magpie';
    this.label = { magpie: 'Magpie', pigeon: 'Pigeon', budgie: 'Budgie' }[this.type];
    this.pigeon = this.type === 'pigeon';
    this.budgie = this.type === 'budgie';
    this.damage = { magpie: 9, pigeon: 6, budgie: 4 }[this.type];
    this.floor = game.level.floorIndex(y);
    this.baseY = game.level.floorY[this.floor];
    this.homeX0 = x; this.homeZ0 = z;
    this.homeX = x; this.homeZ = z;
    this.cruise = this.baseY + { magpie: 1.75, pigeon: 1.45, budgie: 1.55 }[this.type] + Math.random() * 0.2;
    this.angle = Math.random() * Math.PI * 2;
    this.circleR = 1.1 + Math.random() * 0.5;
    this.x = x; this.z = z; this.y = this.cruise;
    this.yaw = 0;
    this.radius = 0.22;
    this.hp = 1; this.alive = true;
    this.state = 'circle';
    this.cooldown = 1 + Math.random() * 1.5;
    this.timer = 0;
    this.swoop = null;
    this.warbleCd = 3 + Math.random() * 5;
    this.vy = 0; this.deadT = 0;
    this.model = makeMagpie(this.type);
    this.blob = makeBlob(0.25);
    game.scene.add(this.model.root, this.blob);
  }

  get center() { return new THREE.Vector3(this.x, this.y, this.z); }

  update(dt) {
    const g = this.game, p = g.player;
    if (!this.alive) {
      this.deadT += dt;
      this.vy -= 12 * dt;
      this.y = Math.max(g.physics.groundHeight(this.x, this.z, 0.2, this.y) + 0.05, this.y + this.vy * dt);
      this.model.root.rotation.z += dt * 8;
      this.model.root.position.set(this.x, this.y, this.z);
      if (this.deadT > 1.4) this.model.root.scale.setScalar(Math.max(0.01, 1 - (this.deadT - 1.4) * 2));
      return this.deadT < 1.9;
    }
    const px = p.x, pz = p.z, py = p.y + 0.3;
    const dx = px - this.x, dz = pz - this.z, dist = Math.hypot(dx, dz);
    const sameFloor = g.level.floorIndex(p.y) === this.floor;
    const aggro = sameFloor && !p.sleeping && !p.dead && dist < 11 && g.physics.lineOfSight(this.x, this.z, px, pz, this.baseY);
    let flap = 12, dive = 0;
    // fly over roofs and tall furniture, and stay above a cat that has climbed up high
    const ceil = this.baseY + (g.def.flyMaxY ?? 2.35);
    const clear = (x, z) => g.physics.solidTopAt(x, z, 0.25, 0.7, ceil) + 0.35;
    const wall = (x, z) => g.level.isWall(Math.floor(x), Math.floor(z), this.baseY);

    this.warbleCd -= dt;
    if (this.warbleCd <= 0) { if (dist < 12 && sameFloor) (this.pigeon ? sound.coo() : sound.birdWarble(this.budgie ? 1.5 : 1)); this.warbleCd = 5 + Math.random() * 6; }

    if (this.state === 'circle' || this.state === 'recover') {
      if (aggro) {
        // drift home toward the cat, staying inside rooms and on a leash
        const hx = this.homeX + Math.sign(dx) * Math.min(Math.abs(dx), 1) * dt * 1.2;
        const hz = this.homeZ + Math.sign(dz) * Math.min(Math.abs(dz), 1) * dt * 1.2;
        if (!wall(hx, hz) && Math.hypot(hx - this.homeX0, hz - this.homeZ0) < 12) {
          this.homeX = hx; this.homeZ = hz;
        }
      }
      this.angle += dt * 1.6;
      let tx = this.homeX + Math.cos(this.angle) * this.circleR;
      let tz = this.homeZ + Math.sin(this.angle) * this.circleR;
      if (wall(tx, tz)) { tx = this.homeX; tz = this.homeZ; }
      const k = Math.min(1, dt * (this.state === 'recover' ? 1.8 : 3));
      this.alt = Math.min(ceil, Math.max(this.cruise, clear(this.x, this.z) + 0.4, clear(tx, tz) + 0.4, aggro && p.y - this.baseY > 0.5 ? p.y + 1.1 : 0));
      this.x += (tx - this.x) * k;
      this.z += (tz - this.z) * k;
      this.y += (this.alt - this.y) * k;
      const vx = -Math.sin(this.angle), vz = Math.cos(this.angle);
      turnToward(this, vx, vz, 6, dt);
      if (this.state === 'recover') {
        this.timer -= dt;
        if (this.timer <= 0) this.state = 'circle';
      } else if (aggro) {
        this.cooldown -= dt;
        if (this.cooldown <= 0) { this.state = 'windup'; this.timer = 0.55; sound.birdScreech(); }
      }
    } else if (this.state === 'windup') {
      this.timer -= dt;
      turnToward(this, dx, dz, 10, dt);
      this.y += Math.sin(this.timer * 30) * 0.004 + dt * 0.3;
      flap = 22;
      if (this.timer <= 0) this.beginSwoop();
    } else if (this.state === 'swoop') {
      const s = this.swoop;
      s.t += dt / s.dur;
      // home in on the cat during the dive
      if (s.t < 0.4) {
        s.T.lerp(new THREE.Vector3(px + p.vx * 0.1, py + 0.02, pz + p.vz * 0.1), Math.min(1, dt * 1.8));
        s.C.copy(s.T).multiplyScalar(2).sub(s.S.clone().add(s.E).multiplyScalar(0.5));
      }
      const t = Math.min(1, s.t), u = 1 - t;
      const nx = u * u * s.S.x + 2 * u * t * s.C.x + t * t * s.E.x;
      const ny = u * u * s.S.y + 2 * u * t * s.C.y + t * t * s.E.y;
      const nz = u * u * s.S.z + 2 * u * t * s.C.z + t * t * s.E.z;
      if (wall(nx, nz)) {
        this.endSwoop();
      } else {
        turnToward(this, nx - this.x, nz - this.z, 14, dt);
        this.x = nx; this.y = Math.max(this.baseY + 0.22, ny, clear(nx, nz) - 0.1); this.z = nz;
        dive = t < 0.55 ? 1 : 0;
        if (!s.hit && Math.hypot(this.x - px, this.y - py, this.z - pz) < 0.6) {
          s.hit = true;
          if (p.damage(this.damage, this.x, this.z, 3.5)) g.hud.label('PECK!', p.labelPos, 'hit', 0.8, 0.6);
        }
        if (s.t >= 1) this.endSwoop();
      }
    }

    // never inside anything solid, never through the ceiling
    this.y = Math.min(ceil, Math.max(this.y, clear(this.x, this.z) - 0.1));
    this.model.root.position.set(this.x, this.y, this.z);
    this.model.root.rotation.y = this.yaw;
    this.model.update(dt, flap, dive);
    const ground = g.physics.groundHeight(this.x, this.z, 0.2, this.y);
    this.blob.position.set(this.x, ground + 0.011, this.z);
    this.blob.scale.setScalar(Math.max(0.3, 1 - (this.y - ground) * 0.3));
    return true;
  }

  beginSwoop() {
    const p = this.game.player;
    const S = new THREE.Vector3(this.x, this.y, this.z);
    // aim a little ahead of where the cat is heading
    const T = new THREE.Vector3(p.x + p.vx * 0.25, p.y + 0.32, p.z + p.vz * 0.25);
    const dir = new THREE.Vector3(T.x - S.x, 0, T.z - S.z);
    const flat = dir.length() || 1;
    dir.divideScalar(flat);
    let reach = 2.5;
    while (reach > 0.5 && this.game.level.isWall(Math.floor(T.x + dir.x * reach), Math.floor(T.z + dir.z * reach), this.baseY)) reach -= 0.5;
    const E = new THREE.Vector3(T.x + dir.x * reach, Math.max(this.alt || this.cruise, T.y + 0.6), T.z + dir.z * reach);
    const C = T.clone().multiplyScalar(2).sub(S.clone().add(E).multiplyScalar(0.5));
    this.swoop = { S, C, E, T, t: 0, dur: Math.min(1.5, Math.max(0.75, flat / 6)), hit: false };
    this.state = 'swoop';
  }

  endSwoop() {
    this.state = 'recover';
    this.timer = 1.2;
    this.cooldown = this.pigeon || this.budgie ? 0.8 + Math.random() * 1.2 : 1.0 + Math.random() * 1.5;
  }

  hit(dmg) {
    if (!this.alive) return false;
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.alive = false;
      this.vy = 1.5;
      this.game.scene.remove(this.blob);
      this.game.particles.burst(this.center, 18, this.pigeon ? ['#8e939c', '#a9aeb6', '#4f9a83'] : this.budgie ? ['#7bd33f', '#ffe14d', '#3a86ff'] : ['#141418', '#f2f2f2', '#333'], 2.5, 0.07, 1.4);
      return true;
    }
    return false;
  }

  dispose() { this.game.scene.remove(this.model.root, this.blob); }
}
