// Dogs: unkillable stealth bosses. Patrol, hear meows and squeaks, spot the cat with a
// vision cone, chase, and can't reach cats up high. Level data can make a small one
// (size, reach, speed, bite) like Grandma's yappy Chihuahua.
import * as THREE from 'three';
import { makeDog, makeBlob } from '../models/creatures.js';
import { sound } from '../audio.js';

const FOV = THREE.MathUtils.degToRad(55);

function wrap(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export class Dog {
  constructor(game, def) {
    this.game = game;
    this.name = def.name;
    this.size = def.size ?? 1;
    this.reach = def.reach ?? 0.85; // cats standing higher than this (above the floor) are safe
    this.chaseSpeed = def.speed ?? 4.4;
    this.biteDamage = def.bite ?? 25;
    this.pitch = this.size < 0.8 ? 2.2 : 1; // little dogs yap
    this.floor = game.level.floorIndex(def.y || 0);
    this.baseY = game.level.floorY[this.floor];
    this.x = def.x; this.z = def.z; this.y = this.baseY;
    this.yaw = 0;
    this.radius = 0.38 * Math.max(0.6, this.size); this.height = 0.85 * this.size;
    this.waypoints = def.waypoints;
    this.bed = { x: def.x, z: def.z };
    this.wp = 0;
    this.state = 'patrol';
    this.timer = 2;
    this.suspicion = 0;
    this.lastSeen = null;
    this.lostTimer = 0;
    this.barkT = 0; this.barkCd = 0; this.biteCd = 0;
    this.lookYaw = 0;
    this.stuckT = 0; this.lastPos = { x: this.x, z: this.z };
    this.model = makeDog(def.coat);
    this.model.root.scale.setScalar(this.size);
    this.blob = makeBlob(0.7 * this.size);
    game.scene.add(this.model.root, this.blob);

    // vision cone on the floor
    const cone = new THREE.CircleGeometry(1, 24, Math.PI / 2 - FOV, FOV * 2);
    cone.rotateX(-Math.PI / 2);
    this.coneMat = new THREE.MeshBasicMaterial({ color: '#ffe066', transparent: true, opacity: 0.12, depthWrite: false });
    this.cone = new THREE.Mesh(cone, this.coneMat);
    this.cone.position.y = 0.02;
    this.cone.renderOrder = 2;
    game.scene.add(this.cone);
  }

  get statusText() {
    switch (this.state) {
      case 'chase': return `${this.name} is CHASING you!`;
      case 'bark': return `${this.name} can't reach you`;
      case 'cooldown': return `${this.name} is growling`;
      case 'investigate': return `${this.name} heard something...`;
      case 'search': return `${this.name} is searching`;
      case 'flee': return `${this.name} is running away!`;
      case 'sleep': return `${this.name} is sulking in bed`;
      default: return this.suspicion > 0.05 ? `${this.name} is suspicious...` : `${this.name}: patrolling`;
    }
  }

  get alerted() { return this.state === 'chase' || this.state === 'cooldown'; }

  canSee(p) {
    if (p.sleeping || p.dead || this.game.level.floorIndex(p.y) !== this.floor) return false;
    const dx = p.x - this.x, dz = p.z - this.z, dist = Math.hypot(dx, dz);
    const range = p.sneaking ? 5.5 : 9;
    if (dist < 1.2) return true; // too close to miss
    if (dist > range) return false;
    const a = Math.abs(wrap(Math.atan2(dx, dz) - (this.yaw + this.lookYaw)));
    if (a > FOV) return false;
    return this.game.physics.lineOfSight(this.x, this.z, p.x, p.z, this.baseY);
  }

  hearNoise(x, z, radius) {
    if (['chase', 'cooldown', 'flee', 'sleep', 'bark'].includes(this.state)) return;
    if (Math.hypot(x - this.x, z - this.z) > radius) return;
    this.state = 'investigate';
    this.noise = { x, z };
    this.timer = 8;
    this.suspicion = Math.max(this.suspicion, 0.4);
  }

  scare() {
    if (this.state === 'flee' || this.state === 'sleep') return;
    this.state = 'flee';
    this.suspicion = 0;
    sound.yelp();
    this.game.hud.feed(`${this.name} yelps and bolts for the dog bed!`);
  }

  moveTo(gx, gz, speed, dt) {
    const step = this.game.level.nextStep('dog', this.x, this.z, gx, gz, this.floor);
    if (!step) return true;
    const sx = step.x - this.x, sz = step.z - this.z, d = Math.hypot(sx, sz);
    const arrived = Math.hypot(gx - this.x, gz - this.z) < 0.4;
    if (arrived) return true;
    if (d > 0.01) {
      const target = Math.atan2(sx, sz);
      const diff = wrap(target - this.yaw);
      this.yaw += Math.max(-6 * dt, Math.min(6 * dt, diff));
      const k = Math.abs(diff) > 1.2 ? 0.3 : 1;
      this.x += Math.sin(this.yaw) * speed * k * dt;
      this.z += Math.cos(this.yaw) * speed * k * dt;
      this.curSpeed = speed * k;
    }
    return false;
  }

  update(dt) {
    const g = this.game, p = g.player;
    this.curSpeed = 0;
    this.barkT -= dt; this.barkCd -= dt; this.biteCd -= dt;
    const dx = p.x - this.x, dz = p.z - this.z, dist = Math.hypot(dx, dz);
    const sees = !['flee', 'sleep'].includes(this.state) && this.canSee(p);
    const reachable = this.game.level.floorIndex(p.y) === this.floor && p.y - this.baseY < this.reach;

    // suspicion meter
    if (sees && !this.alerted && this.state !== 'bark') {
      const range = p.sneaking ? 5.5 : 9;
      const rate = (0.35 + (1 - dist / range) * 1.6) * (p.sneaking ? 0.5 : 1);
      this.suspicion = Math.min(1, this.suspicion + rate * dt);
      if (this.suspicion >= 1) {
        if (reachable) this.startChase();
        else this.startBark();
      }
    } else if (!this.alerted) {
      this.suspicion = Math.max(0, this.suspicion - 0.25 * dt);
    }
    if (sees) { this.lastSeen = { x: p.x, z: p.z }; this.lostTimer = 0; }

    switch (this.state) {
      case 'patrol': {
        const [wx, wz, wait] = this.waypoints[this.wp];
        if (this.moveTo(wx, wz, 1.7, dt)) {
          this.state = 'pause';
          this.timer = wait || 0.3;
        }
        this.lookYaw = Math.sin(g.time * 0.8) * 0.35;
        break;
      }
      case 'pause':
        this.timer -= dt;
        this.lookYaw = Math.sin(g.time * 1.6) * 0.8;
        if (this.timer <= 0) { this.wp = (this.wp + 1) % this.waypoints.length; this.state = 'patrol'; }
        break;
      case 'investigate':
        this.timer -= dt;
        if (this.moveTo(this.noise.x, this.noise.z, 2.6, dt) || this.timer <= 0) {
          this.lookYaw = Math.sin(g.time * 2.5) * 0.9;
          if (this.timer > 2.5) this.timer = 2.5;
          if (this.timer <= 0) this.returnToPatrol();
        }
        break;
      case 'chase': {
        this.lookYaw *= 0.8;
        if (!sees) this.lostTimer += dt;
        if (!reachable) { this.startBark(); break; }
        if (this.lostTimer > 3) {
          this.state = 'search';
          this.timer = 4;
          g.hud.feed(`${this.name} lost sight of you...`);
          break;
        }
        const target = sees || !this.lastSeen ? { x: p.x, z: p.z } : this.lastSeen;
        this.moveTo(target.x, target.z, this.chaseSpeed, dt);
        if (this.barkCd <= 0) { sound.bark(this.pitch > 1 ? 4 : 2, this.pitch); this.barkT = 0.5; this.barkCd = this.pitch > 1 ? 1.2 : 2.2; }
        if (dist < 0.5 + 0.35 * this.size && reachable && this.biteCd <= 0) {
          if (p.damage(this.biteDamage, this.x, this.z, 6.5 * Math.max(0.5, this.size))) {
            g.hud.feed(`CHOMP! ${this.name} got you!`);
            g.hud.label('WOOF!', p.labelPos, 'hit', 0.9, 0.6);
            sound.growl();
          }
          this.biteCd = 2.4;
          this.state = 'cooldown';
          this.timer = 2.0;
        }
        break;
      }
      case 'cooldown':
        this.timer -= dt;
        if (this.timer <= 0) this.state = 'chase';
        break;
      case 'bark': {
        // cat is up high: stand underneath and bark, then give up
        this.timer -= dt;
        if (dist > 1.4) this.moveTo(p.x, p.z, 3, dt);
        else this.yaw += wrap(Math.atan2(dx, dz) - this.yaw) * Math.min(1, dt * 5);
        if (this.barkCd <= 0) { sound.bark(this.pitch > 1 ? 5 : 3, this.pitch); this.barkT = 0.7; this.barkCd = 1.4; }
        if (reachable && sees && dist < 6) { this.startChase(); break; }
        if (this.timer <= 0 || dist > 12) {
          g.hud.feed(`${this.name} gives up and wanders off.`);
          this.suspicion = 0.3;
          this.returnToPatrol();
        }
        break;
      }
      case 'search':
        this.timer -= dt;
        if (this.lastSeen) this.moveTo(this.lastSeen.x, this.lastSeen.z, 2.5, dt);
        this.lookYaw = Math.sin(g.time * 3) * 1.0;
        if (sees && reachable) { this.startChase(); break; }
        if (this.timer <= 0) { this.suspicion = 0.4; this.returnToPatrol(); }
        break;
      case 'return': {
        const [wx, wz] = this.waypoints[this.wp];
        if (this.moveTo(wx, wz, 2.0, dt)) this.state = 'patrol';
        break;
      }
      case 'flee':
        if (this.moveTo(this.bed.x, this.bed.z, 5.5, dt)) {
          this.state = 'sleep';
          this.timer = 15;
        }
        break;
      case 'sleep':
        this.timer -= dt;
        if (this.timer <= 0) { this.wp = 0; this.state = 'patrol'; }
        break;
    }

    // unstick: if trying to move but not going anywhere, shuffle sideways
    const moved = Math.hypot(this.x - this.lastPos.x, this.z - this.lastPos.z);
    this.stuckT = this.curSpeed > 0.5 && moved < this.curSpeed * dt * 0.2 ? this.stuckT + dt : 0;
    if (this.stuckT > 0.6) { this.yaw += (Math.random() - 0.5) * 2; this.stuckLong = (this.stuckLong || 0) + this.stuckT; this.stuckT = 0; }
    else if (this.curSpeed > 0.5 && moved > this.curSpeed * dt * 0.5) this.stuckLong = 0;
    // still wedged after a couple of seconds on patrol: give up on this waypoint
    if (this.stuckLong > 2 && (this.state === 'patrol' || this.state === 'return')) {
      this.wp = (this.wp + 1) % this.waypoints.length;
      this.state = 'patrol';
      this.stuckLong = 0;
    }
    g.physics.resolve(this);
    this.lastPos.x = this.x; this.lastPos.z = this.z;

    this.model.root.position.set(this.x, this.baseY, this.z);
    this.model.root.rotation.y = this.yaw;
    this.model.update(dt, this.curSpeed, {
      barkT: this.barkT, chasing: this.state === 'chase', lookYaw: this.lookYaw,
      sleeping: this.state === 'sleep', happy: this.state === 'flee',
    });
    this.blob.position.set(this.x, this.baseY + 0.013, this.z);

    // vision cone visual
    const range = p.sneaking ? 5.5 : 9;
    this.cone.visible = !['flee', 'sleep'].includes(this.state);
    this.cone.position.set(this.x, this.baseY + 0.02, this.z);
    this.cone.rotation.y = this.yaw + this.lookYaw + Math.PI; // geometry points -Z
    this.cone.scale.set(range, 1, range);
    const hot = this.alerted || this.state === 'bark';
    this.coneMat.color.set(hot ? '#ff3b3b' : this.suspicion > 0.05 ? '#ffa94d' : '#ffe066');
    this.coneMat.opacity = hot ? 0.16 : 0.09 + this.suspicion * 0.12;
  }

  startChase() {
    if (this.state !== 'chase') {
      sound.alert();
      sound.bark(this.pitch > 1 ? 4 : 2, this.pitch);
      this.barkT = 0.5; this.barkCd = 2;
      this.game.hud.feed(`${this.name} spotted you! Get up high or break line of sight!`);
      this.game.hud.label('!', () => new THREE.Vector3(this.x, 1.35, this.z), 'alert', 1.2);
    }
    this.state = 'chase';
    this.suspicion = 1;
    this.lostTimer = 0;
  }

  startBark() {
    if (this.state !== 'bark') this.timer = 4.5;
    this.state = 'bark';
    this.suspicion = 1;
  }

  returnToPatrol() {
    // head to the nearest waypoint
    let best = 0, bd = Infinity;
    this.waypoints.forEach(([x, z], i) => {
      const d = Math.hypot(x - this.x, z - this.z);
      if (d < bd) { bd = d; best = i; }
    });
    this.wp = best;
    this.state = 'return';
  }

  dispose() { this.game.scene.remove(this.model.root, this.blob, this.cone); }
}
