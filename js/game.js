// One play session of a level: world, entities, camera and rules.
import * as THREE from 'three';
import { Level } from './level/map.js';
import { PhysicsWorld } from './physics.js';
import { getLevel } from './level/levels.js';
import { Player, MAX_HEALTH, MAX_AMMO } from './entities/player.js';
import { Rat, Magpie } from './entities/enemies.js';
import { Dog } from './entities/dog.js';
import { Human, Pickup, ToyProjectile, Particles, RainbowTrail, RAINBOW } from './entities/misc.js';
import { sound, startNyanMusic, stopNyanMusic } from './audio.js';

const CONFETTI = ['#ff4d6d', '#ffd60a', '#4cc9f0', '#80ed99', '#c77dff', '#ffffff'];

const FISH_LINES = ['Aww, hungry {n}?', 'Here you go, sweetie!', "Who's a good kitty?", 'Fish for my favourite cat!', "Don't tell the dog."];
const TOY_LINES = ['Want to play? Fetch!', 'Here, chase this!', 'Squeaky time!'];
const FULL_LINES = ['You look well fed, {n}!', 'You just ate, you little beggar!', 'Nice try, {n}.'];

export class Game {
  constructor(renderer, hud, opts) {
    this.renderer = renderer;
    this.hud = hud;
    this.opts = opts; // { levelId, name, hat, attract, onWin, onLose, settings }
    this.attract = !!opts.attract;
    const def = (this.def = getLevel(opts.levelId));
    this.time = 0; // level timer (stops when paused/over)
    this.clock = 0; // always ticks, for ambient animation
    this.timeLimit = def.timeLimit;
    this.over = false;

    const scene = (this.scene = new THREE.Scene());
    scene.background = new THREE.Color(def.background || '#2a2030');
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 90);
    this.camPos = new THREE.Vector3();
    this.camLook = new THREE.Vector3();
    this.shake = 0;

    this.level = new Level(def);
    this.physics = new PhysicsWorld(this.level);
    const data = (this.data = def.build(scene, this.physics, this.level));

    this.particles = new Particles(scene);
    this.trail = new RainbowTrail(scene);
    this.humans = data.humans.map((h) => new Human(this, h));
    this.level.buildNav('small', 0.2, this.physics.boxes, 0.16);
    this.level.buildNav('dog', 0.85, this.physics.boxes, 0.36);

    this.player = new Player(this, data.start, opts.name || 'Mittens', opts.hat || 'none');
    this.enemies = [
      ...data.rats.map((r) => new Rat(this, r.x, r.z)),
      ...data.birds.map((b) => new Magpie(this, b.x, b.z)),
    ];
    this.totalEnemies = this.enemies.length;
    this.dog = new Dog(this, data.dog);
    this.pickups = data.pickups.map(([type, x, z]) => new Pickup(this, type, x, 0, z));
    this.projectiles = [];

    // nap spots: glowing rings, hidden until the house is clear
    this.goals = data.goals;
    this.goalsOpen = false;
    this.goalMarkers = this.goals.map((g) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(g.r + 0.1, 0.035, 8, 40),
        new THREE.MeshBasicMaterial({ color: '#ffe066', transparent: true, opacity: 0.9 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(g.x, g.minY + 0.15, g.z);
      ring.visible = false;
      scene.add(ring);
      return ring;
    });
    this.goalHintCd = 0;

    if (this.attract) {
      this.player.sleeping = true;
    } else {
      hud.reset(this.player.name);
      hud.feed(def.intro);
      hud.feed(`Watch out for ${this.dog.name} the dog - you can't fight him. Climb up high to escape!`);
    }
    this.prompt = document.getElementById('hud-prompt');
    this.updateCamera(1, true);
  }

  roomName(letter) { return this.def.rooms[letter]?.name || ''; }

  // ---------------------------------------------------------------- update
  update(dt, input, sens) {
    this.time += this.over || this.attract ? 0 : dt;
    this.clock += dt;
    const p = this.player;
    if (!this.attract && !this.over) p.update(dt, input, sens);
    else p.update(dt, { down: () => false, hit: () => false, mouseDX: 0 }, 0);

    for (const h of this.humans) h.update(dt);
    this.enemies = this.enemies.filter((e) => e.update(dt) || (e.dispose(), false));
    this.dog.update(dt);

    // dog body blocks the cat
    const ddx = p.x - this.dog.x, ddz = p.z - this.dog.z, dd = Math.hypot(ddx, ddz);
    const minD = p.radius + this.dog.radius;
    if (dd < minD && dd > 0.001 && p.y < 0.8 && !p.nyan) {
      p.x += (ddx / dd) * (minD - dd);
      p.z += (ddz / dd) * (minD - dd);
      this.physics.resolve(p);
    }

    this.projectiles = this.projectiles.filter((pr) => pr.update(dt) || (pr.dispose(), false));
    this.updatePickups(dt);
    this.particles.update(dt);
    if (p.nyan) this.updateNyan(dt);
    if (this.trail.points.length) {
      if (!p.nyan && this.time - this.trail.points[0].t > 1.8) this.trail.clear();
      else this.trail.update(this.time);
    }

    // level-specific ambient animation (TV flicker, clothesline, BBQ smoke...)
    this.data.update?.(dt, this.clock, this);

    if (!this.attract && !this.over) {
      this.updatePrompt();
      this.updateGoals(dt);
      if (this.time >= this.timeLimit) this.lose('time');
    }
    if (this.goalsOpen) {
      this.goalMarkers.forEach((m, i) => {
        m.position.y = this.goals[i].minY + 0.15 + Math.sin(this.time * 3 + i) * 0.05;
        m.scale.setScalar(1 + Math.sin(this.time * 4) * 0.08);
      });
    }
    this.updateCamera(dt);
    if (!this.attract) this.hud.update(dt, this);
  }

  // ---------------------------------------------------------------- camera
  updateCamera(dt, snap = false) {
    const p = this.player, cam = this.camera;
    let pos, look;
    if (this.attract) {
      const A = this.def.attract, a = performance.now() / 9000;
      pos = new THREE.Vector3(A.cx + Math.cos(a) * A.rx, A.y, A.cz + Math.sin(a) * A.rz);
      look = new THREE.Vector3(...A.look);
      this.player.x = A.cat[0]; this.player.z = A.cat[1];
      cam.position.copy(pos);
      cam.lookAt(look);
      return;
    }
    if (p.sleeping) {
      const a = performance.now() / 3000;
      pos = new THREE.Vector3(p.x + Math.cos(a) * 1.6, p.y + 0.9, p.z + Math.sin(a) * 1.6);
      look = new THREE.Vector3(p.x, p.y + 0.2, p.z);
      this.clampCamera(new THREE.Vector3(p.x, p.y + 0.5, p.z), pos);
    } else {
      const fw = p.forward;
      const rx = -fw.z, rz = fw.x; // cat's right
      const back = p.nyan ? 2.8 : 2.25;
      pos = new THREE.Vector3(p.x - fw.x * back + rx * 0.55, p.y + (p.nyan ? 1.2 : 1.05), p.z - fw.z * back + rz * 0.55);
      look = new THREE.Vector3(p.x + fw.x * 4 + rx * 0.35, p.y + 0.5, p.z + fw.z * 4 + rz * 0.35);
      this.clampCamera(new THREE.Vector3(p.x + rx * 0.2, p.y + 0.6, p.z + rz * 0.2), pos);
    }
    pos.y = Math.min(pos.y, this.def.camMaxY);
    const k = snap ? 1 : 1 - Math.exp(-dt * 20);
    this.camPos.lerp(pos, k);
    this.camLook.lerp(look, k);
    if (snap) { this.camPos.copy(pos); this.camLook.copy(look); }
    cam.position.copy(this.camPos);
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt);
      const s = this.shake * 0.6;
      cam.position.x += (Math.random() - 0.5) * s;
      cam.position.y += (Math.random() - 0.5) * s;
    }
    cam.lookAt(this.camLook);
    const fov = p.nyan ? 84 : 70;
    if (Math.abs(cam.fov - fov) > 0.1) { cam.fov += (fov - cam.fov) * Math.min(1, dt * 4); cam.updateProjectionMatrix(); }
  }

  // pull the camera in so it never ends up inside a wall
  clampCamera(pivot, pos) {
    const dir = pos.clone().sub(pivot);
    const len = dir.length();
    dir.divideScalar(len);
    let safe = len;
    const margin = 0.18;
    for (let d = 0; d <= len + margin; d += 0.04) {
      const x = pivot.x + dir.x * d, z = pivot.z + dir.z * d;
      if (this.level.isWall(Math.floor(x), Math.floor(z)) ||
        this.level.isWall(Math.floor(x + margin), Math.floor(z)) || this.level.isWall(Math.floor(x - margin), Math.floor(z)) ||
        this.level.isWall(Math.floor(x), Math.floor(z + margin)) || this.level.isWall(Math.floor(x), Math.floor(z - margin))) {
        safe = Math.max(0.25, d - 0.06);
        break;
      }
    }
    if (safe < len) pos.copy(pivot).addScaledVector(dir, safe);
  }

  cameraShake(a) { this.shake = Math.max(this.shake, a); }

  // ---------------------------------------------------------------- combat
  playerSwatHit(point) {
    let any = false;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (e.center.distanceTo(point) < 0.5 + e.radius) {
        any = true;
        this.particles.burst(e.center, 8, ['#ffffff', '#cccccc'], 2, 0.05, 0.5);
        if (e.hit(1, this.player.x, this.player.z)) this.onKill(e);
      }
    }
    if (any) { sound.hit(); this.cameraShake(0.06); }
  }

  throwToy(p) {
    const fw = p.forward;
    this.projectiles.push(new ToyProjectile(this,
      p.x + fw.x * 0.4, p.y + 0.5, p.z + fw.z * 0.4,
      fw.x * 9 + p.vx * 0.4, 3.4, fw.z * 9 + p.vz * 0.4));
  }

  explodeToy(pos) {
    sound.explode();
    this.cameraShake(0.12);
    this.particles.burst(pos, 70, CONFETTI, 5, 0.08, 1.4, 6);
    this.particles.burst(pos, 25, ['#ffd60a', '#fff3b0'], 3, 0.08, 0.8, 3);
    this.hud.label('SQUEAK!', pos.clone().setY(pos.y + 0.4), 'pop', 1.1, 0.6);
    for (const e of this.enemies) {
      if (e.alive && e.center.distanceTo(pos) < 2.3) {
        if (e.hit(3, pos.x, pos.z)) this.onKill(e);
      }
    }
    this.dog.hearNoise(pos.x, pos.z, 14);
  }

  onKill(e) {
    sound.catFight();
    this.player.registerKill();
    const left = this.enemies.filter((x) => x.alive).length;
    const what = e.kind === 'rat' ? 'Rat' : 'Magpie';
    const verbs = e.kind === 'rat' ? ['squished', 'bopped', 'sent packing'] : ['grounded', 'plucked', 'swatted out of the sky'];
    this.hud.feed(`${what} ${verbs[(Math.random() * verbs.length) | 0]}! ${left} pest${left === 1 ? '' : 's'} left.`);
    const tag = ['HISS!', 'MRRAOW!', 'POW!', 'YOWL!'][(Math.random() * 4) | 0];
    this.hud.label(tag, e.center.clone().setY(e.center.y + 0.4), 'pop', 0.9, 0.8);
    if (left === 0) this.openGoals();
  }

  onPlayerHurt() {
    this.hud.flashDamage();
    this.cameraShake(0.18);
    if (this.player.health <= 0) this.lose('health');
  }

  onMeow(p) {
    this.dog.hearNoise(p.x, p.z, 7);
    let best = null, bd = 2.6;
    for (const h of this.humans) {
      const d = Math.hypot(h.x - p.x, h.z - p.z);
      if (d < bd) { bd = d; best = h; }
    }
    if (!best) {
      this.hud.label('Meow!', () => new THREE.Vector3(p.x, p.y + 0.85, p.z), 'bubble', 1.1);
      return;
    }
    const n = p.name;
    const say = (lines) => this.hud.label(lines[(Math.random() * lines.length) | 0].replace('{n}', n), best.headPos, 'bubble', 2.6);
    this.hud.label('Meow?', () => new THREE.Vector3(p.x, p.y + 0.85, p.z), 'bubble', 1.0);
    if (best.cooldown > 0) {
      say([`Not now, ${n}. Maybe in a bit.`, 'I just fed you!', 'Shoo, I\'m busy!']);
      return;
    }
    const toward = { x: (p.x - best.x), z: (p.z - best.z) };
    const tl = Math.hypot(toward.x, toward.z) || 1;
    const vel = new THREE.Vector3((toward.x / tl) * 1.6, 3.2, (toward.z / tl) * 1.6);
    if (p.health < MAX_HEALTH) {
      say(FISH_LINES);
      best.model.toss();
      this.pickups.push(new Pickup(this, 'fish', best.x, 1.2, best.z, vel));
      best.cooldown = 16;
    } else if (p.ammo < MAX_AMMO) {
      say(TOY_LINES);
      best.model.toss();
      this.pickups.push(new Pickup(this, 'toy', best.x, 1.2, best.z, vel));
      best.cooldown = 16;
    } else {
      say(FULL_LINES);
      best.model.wave();
      best.cooldown = 4;
    }
  }

  updatePickups(dt) {
    const p = this.player;
    for (const k of [...this.pickups]) {
      k.update(dt);
      if (this.attract || k.vel) continue;
      if (Math.hypot(k.x - p.x, k.z - p.z) < 0.6 && Math.abs((k.ground ?? 0) - p.y) < 0.8) {
        if (k.type === 'fish') {
          if (p.health >= MAX_HEALTH) continue;
          p.heal(30);
          sound.eat();
          this.hud.label('Nom nom!', () => new THREE.Vector3(p.x, p.y + 0.85, p.z), 'bubble', 1.2);
          this.hud.feed('Fish! +30 health');
        } else {
          if (p.ammo >= MAX_AMMO) continue;
          p.ammo = Math.min(MAX_AMMO, p.ammo + 2);
          sound.pickup();
          this.hud.feed('Squeaky toys! +2');
        }
        this.particles.burst(new THREE.Vector3(k.x, k.y + 0.2, k.z), 12, ['#fff3b0', '#ffffff'], 1.5, 0.05, 0.5, 2);
        k.dispose();
        this.pickups.splice(this.pickups.indexOf(k), 1);
      }
    }
  }

  // ---------------------------------------------------------------- nyan mode
  onNyanStart() {
    this.hud.feed('NYAN MODE! Rainbow everything!');
    this.hud.label('NYAN!', () => new THREE.Vector3(this.player.x, this.player.y + 1, this.player.z), 'pop', 1.4, 0.5);
    sound.sparkle();
    if (this.opts.settings.music) startNyanMusic();
  }

  onNyanEnd() {
    stopNyanMusic();
    this.hud.feed('Nyan Mode wore off.');
  }

  updateNyan(dt) {
    const p = this.player, fw = p.forward;
    this.trail.push(p.x - fw.x * 0.3, p.y, p.z - fw.z * 0.3, p.yaw, this.time);
    // spew rainbows from the mouth
    const mx = p.x + fw.x * 0.5, my = p.y + 0.42, mz = p.z + fw.z * 0.5;
    for (let i = 0; i < 6; i++) {
      const spread = (Math.random() - 0.5) * 0.35;
      const sx = Math.sin(p.yaw + spread), sz = Math.cos(p.yaw + spread);
      const sp = 9 + Math.random() * 4;
      this.particles.emit(mx, my + (Math.random() - 0.5) * 0.2, mz, sx * sp, (Math.random() - 0.3) * 1.5, sz * sp,
        RAINBOW[(Math.random() * RAINBOW.length) | 0], 0.45, 0, 0.5);
    }
    // everything in your path goes down
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const dx = e.x - p.x, dz = e.z - p.z, d = Math.hypot(dx, dz);
      const ang = Math.abs(Math.atan2(Math.sin(Math.atan2(dx, dz) - p.yaw), Math.cos(Math.atan2(dx, dz) - p.yaw)));
      const touched = d < 1.3;
      const beamed = d < 7 && ang < 0.35 && this.physics.lineOfSight(p.x, p.z, e.x, e.z);
      if (touched || beamed) {
        this.particles.burst(e.center, 30, RAINBOW, 4, 0.08, 1.0, 4);
        if (e.hit(99, p.x, p.z)) this.onKill(e);
      }
    }
    const dog = this.dog;
    const dd = Math.hypot(dog.x - p.x, dog.z - p.z);
    const dang = Math.abs(Math.atan2(Math.sin(Math.atan2(dog.x - p.x, dog.z - p.z) - p.yaw), Math.cos(Math.atan2(dog.x - p.x, dog.z - p.z) - p.yaw)));
    if (dd < 1.6 || (dd < 5 && dang < 0.35 && this.physics.lineOfSight(p.x, p.z, dog.x, dog.z))) dog.scare();
  }

  // ---------------------------------------------------------------- goals / end
  openGoals() {
    this.goalsOpen = true;
    this.goalMarkers.forEach((m) => (m.visible = true));
    sound.sparkle();
    this.hud.feed(this.def.cleared);
    for (const g of this.goals) this.hud.label('Zzz', new THREE.Vector3(g.x, g.minY + 0.9, g.z), 'zzz', Infinity);
  }

  nearestGoal() {
    const p = this.player;
    return this.goals.reduce((a, b) => (Math.hypot(a.x - p.x, a.z - p.z) < Math.hypot(b.x - p.x, b.z - p.z) ? a : b));
  }

  updateGoals(dt) {
    const p = this.player;
    this.goalHintCd -= dt;
    for (const g of this.goals) {
      const on = Math.hypot(p.x - g.x, p.z - g.z) < g.r && p.y >= g.minY && p.y <= g.maxY && p.grounded && !p.nyan;
      if (!on) continue;
      if (this.goalsOpen) { this.win(g); return; }
      if (this.goalHintCd <= 0) {
        const left = this.enemies.filter((e) => e.alive).length;
        this.hud.feed(`Comfy... but ${left} pest${left === 1 ? ' is' : 's are'} still about. No napping yet!`);
        this.goalHintCd = 4;
      }
    }
  }

  updatePrompt() {
    const p = this.player;
    let text = '';
    for (const h of this.humans) {
      if (Math.hypot(h.x - p.x, h.z - p.z) < 2.6) {
        const need = p.health < MAX_HEALTH ? 'food' : p.ammo < MAX_AMMO ? 'a toy' : 'attention';
        text = h.cooldown > 0 ? `${h.name} is busy (${Math.ceil(h.cooldown)}s)` : `Press <b>E</b> to meow at ${h.name} for ${need}`;
      }
    }
    if (p.stamina < 24 && !text) text = 'Too tired to jump - rest a moment';
    this.prompt.innerHTML = text;
    this.prompt.classList.toggle('hidden', !text);
  }

  win(goal) {
    if (this.over) return;
    this.over = true;
    const p = this.player;
    if (p.nyan) p.endNyan();
    p.x = goal.x; p.z = goal.z;
    p.sleeping = true;
    this.prompt.classList.add('hidden');
    sound.win();
    setTimeout(() => sound.purr(3.5), 600);
    let n = 0;
    const zzz = setInterval(() => {
      this.hud.label('z', new THREE.Vector3(p.x + 0.2, p.y + 0.6, p.z), 'zzz', 2, 0.5);
      if (++n > 6) clearInterval(zzz);
    }, 450);
    this.hud.feed(`${p.name} curls up on ${goal.name}. Purrfect.`);
    setTimeout(() => this.opts.onWin?.(this.time, goal), 3600);
  }

  lose(reason) {
    if (this.over) return;
    this.over = true;
    const p = this.player;
    if (p.nyan) p.endNyan();
    p.dead = true;
    p.model.root.rotation.z = Math.PI / 2;
    stopNyanMusic();
    sound.lose();
    this.prompt.classList.add('hidden');
    setTimeout(() => this.opts.onLose?.(reason), 1800);
  }

  // ---------------------------------------------------------------- lifecycle
  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    stopNyanMusic();
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          if (m.map) m.map.dispose();
        }
      }
    });
  }
}
