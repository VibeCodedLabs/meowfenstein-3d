// The player cat: movement, jumping with fatigue, swats, squeaky-toy throws,
// meows, and Nyan Mode.
import * as THREE from 'three';
import { CatModel } from '../models/cat.js';
import { makeBlob } from '../models/creatures.js';
import { GRAVITY } from '../physics.js';
import { sound } from '../audio.js';

export const MAX_HEALTH = 100;
export const MAX_AMMO = 9;
export const JUMP_COST = 24;
export const NYAN_DURATION = 9;
export const STREAK_WINDOW = 8;
export const STREAK_NEEDED = 3;

const WALK = 4.3, SNEAK = 2.0, NYAN_SPEED = 8.5, TURN = 2.6, JUMP_V = 7.0;

export class Player {
  constructor(game, start, name, hatId) {
    this.game = game;
    this.name = name;
    this.x = start.x; this.z = start.z; this.y = 0; this.vy = 0;
    this.yaw = start.yaw;
    this.radius = 0.22; this.height = 0.5;
    this.vx = 0; this.vz = 0; this.kx = 0; this.kz = 0;
    this.grounded = true; this.coyote = 0;
    this.health = MAX_HEALTH;
    this.ammo = 3;
    this.stamina = 100; this.staminaDelay = 0;
    this.swatCd = 0; this.swatPending = -1;
    this.throwCd = 0; this.meowCd = 0;
    this.invuln = 0;
    this.idleTime = 0;
    this.sneaking = false;
    this.streak = 0; this.lastKillTime = -99;
    this.nyanCharged = false; this.nyanTime = 0;
    this.sleeping = false;
    this.dead = false;

    this.model = new CatModel('tuxedo');
    this.model.setHat(hatId);
    this.model.root.scale.setScalar(0.95);
    game.scene.add(this.model.root);
    this.blob = makeBlob(0.35);
    game.scene.add(this.blob);
  }

  get forward() { return { x: Math.sin(this.yaw), z: Math.cos(this.yaw) }; }
  get nyan() { return this.nyanTime > 0; }

  update(dt, input, sens) {
    const g = this.game;
    if (this.sleeping) {
      this.model.update(dt, { speed: 0, grounded: true, sleeping: true });
      this.syncModel();
      return;
    }

    // ---- turning (horizontal only, Wolfenstein style) ----
    let turn = 0;
    if (input.down('ArrowLeft')) turn += 1;
    if (input.down('ArrowRight')) turn -= 1;
    this.yaw += turn * TURN * dt - input.mouseDX * 0.0024 * sens - (input.edgeTurn || 0) * 2.3 * dt * Math.min(1.6, Math.max(0.6, sens));

    // ---- movement ----
    let f = 0, s = 0;
    if (input.down('KeyW', 'ArrowUp')) f += 1;
    if (input.down('KeyS', 'ArrowDown')) f -= 1;
    if (input.down('KeyA')) s += 1;
    if (input.down('KeyD')) s -= 1;
    this.sneaking = input.down('ShiftLeft', 'ShiftRight') && !this.nyan;
    const speed = this.nyan ? NYAN_SPEED : this.sneaking ? SNEAK : WALK;
    const fw = this.forward;
    // left vector (cat's left when facing +Z is +X)
    const lx = fw.z, lz = -fw.x;
    let mx = fw.x * f + lx * s, mz = fw.z * f + lz * s;
    const ml = Math.hypot(mx, mz);
    if (ml > 0) { mx /= ml; mz /= ml; }
    const accel = this.grounded || this.nyan ? 14 : 5;
    this.vx += (mx * speed - this.vx) * Math.min(1, accel * dt);
    this.vz += (mz * speed - this.vz) * Math.min(1, accel * dt);
    this.kx *= Math.pow(0.02, dt); this.kz *= Math.pow(0.02, dt);
    this.x += (this.vx + this.kx) * dt;
    this.z += (this.vz + this.kz) * dt;
    this.ignoreBoxes = this.nyan;
    g.physics.resolve(this);

    // ---- vertical ----
    if (this.nyan) {
      const floor = 0.35 + Math.sin(g.time * 6) * 0.05;
      this.y += (floor - this.y) * Math.min(1, dt * 6);
      this.vy = 0;
      this.grounded = true;
    } else {
      this.coyote = this.grounded ? 0.1 : this.coyote - dt;
      if (input.hit('Space') && this.coyote > 0) {
        if (this.stamina >= JUMP_COST) {
          this.vy = JUMP_V;
          this.stamina -= JUMP_COST;
          this.staminaDelay = 0.5;
          this.grounded = false;
          this.coyote = 0;
          sound.jump();
        } else {
          g.hud.feed(`${this.name} is too tired to jump! Catch your breath.`);
        }
      }
      this.vy -= GRAVITY * dt;
      let ny = this.y + this.vy * dt;
      if (this.vy > 0) {
        const ceil = g.physics.ceilingAbove(this);
        if (ny + this.height > ceil) { ny = ceil - this.height; this.vy = 0; }
      }
      const ground = g.physics.groundHeight(this.x, this.z, this.radius, Math.max(this.y, ny));
      if (ny <= ground) {
        if (!this.grounded && this.vy < -9) g.cameraShake(0.08);
        ny = ground; this.vy = 0; this.grounded = true;
      } else {
        this.grounded = false;
      }
      this.y = ny;
      g.physics.resolve(this);
    }

    // ---- stamina / jump fatigue ----
    if (this.staminaDelay > 0) this.staminaDelay -= dt;
    else if (this.grounded) this.stamina = Math.min(100, this.stamina + 17 * dt);

    // ---- actions ----
    this.swatCd -= dt; this.throwCd -= dt; this.meowCd -= dt; this.invuln -= dt;
    if (input.hit('Mouse0', 'KeyJ', 'KeyZ') && this.swatCd <= 0) {
      this.swatCd = 0.38;
      this.swatPending = 0.1;
      this.model.swat();
      sound.swat();
    }
    if (this.swatPending > 0) {
      this.swatPending -= dt;
      if (this.swatPending <= 0) g.playerSwatHit(this.swatPoint());
    }
    if (input.hit('Mouse2', 'KeyK', 'KeyX') && this.throwCd <= 0) {
      if (this.ammo > 0) {
        this.ammo--;
        this.throwCd = 0.5;
        this.model.swat();
        g.throwToy(this);
        sound.throw();
      } else {
        this.throwCd = 0.4;
        g.hud.feed('No squeaky toys left! Find some, or meow at a human.');
      }
    }
    if (input.hit('KeyE', 'KeyC') && this.meowCd <= 0) {
      this.meowCd = 0.8;
      this.model.meow();
      sound.meow();
      g.onMeow(this);
    }
    if (input.hit('KeyQ') && this.nyanCharged && !this.nyan) this.startNyan();

    // ---- streak timeout ----
    if (!this.nyan && g.time - this.lastKillTime > STREAK_WINDOW && this.streak > 0 && !this.nyanCharged) this.streak = 0;

    // ---- nyan ----
    if (this.nyan) {
      this.nyanTime -= dt;
      if (this.nyanTime <= 0) this.endNyan();
    }

    // ---- animation ----
    const hs = Math.hypot(this.vx, this.vz);
    const moving = hs > 0.3 || !this.grounded;
    this.idleTime = moving ? 0 : this.idleTime + dt;
    this.model.update(dt, { speed: hs, grounded: this.grounded, vy: this.vy, idle: this.idleTime > 2.5 });
    this.syncModel();
  }

  syncModel() {
    this.model.root.position.set(this.x, this.y, this.z);
    this.model.root.rotation.y = this.yaw;
    const ground = this.game.physics.groundHeight(this.x, this.z, this.radius, this.y + 0.01);
    this.blob.position.set(this.x, ground + 0.012, this.z);
    const h = Math.max(0, this.y - ground);
    this.blob.scale.setScalar(Math.max(0.4, 1 - h * 0.4));
  }

  swatPoint() {
    const fw = this.forward;
    return new THREE.Vector3(this.x + fw.x * 0.45, this.y + 0.3, this.z + fw.z * 0.45);
  }

  damage(amount, fromX, fromZ, knock = 3) {
    if (this.invuln > 0 || this.nyan || this.dead || this.sleeping) return false;
    this.health = Math.max(0, this.health - amount);
    this.invuln = 0.7;
    this.model.hurt();
    sound.yowl();
    const dx = this.x - fromX, dz = this.z - fromZ, d = Math.hypot(dx, dz) || 1;
    this.kx = (dx / d) * knock; this.kz = (dz / d) * knock;
    if (this.grounded && knock > 4) { this.vy = 3.5; this.grounded = false; }
    this.game.onPlayerHurt(amount);
    return true;
  }

  heal(amount) {
    this.health = Math.min(MAX_HEALTH, this.health + amount);
  }

  registerKill() {
    if (this.nyan) return;
    const t = this.game.time;
    this.streak = t - this.lastKillTime <= STREAK_WINDOW ? this.streak + 1 : 1;
    this.lastKillTime = t;
    if (this.streak >= STREAK_NEEDED && !this.nyanCharged) {
      this.nyanCharged = true;
      this.streak = STREAK_NEEDED;
      sound.sparkle();
      this.game.hud.feed('KILL STREAK! Nyan Mode is ready - press Q!');
    }
  }

  startNyan() {
    this.nyanCharged = false;
    this.nyanTime = NYAN_DURATION;
    this.model.setNyan(true);
    this.game.onNyanStart();
  }

  endNyan() {
    this.nyanTime = 0;
    this.streak = 0;
    this.model.setNyan(false);
    // drop back down onto whatever is below
    this.ignoreBoxes = false;
    this.game.physics.resolve(this);
    this.game.onNyanEnd();
  }

  dispose() {
    this.game.scene.remove(this.model.root, this.blob);
  }
}
