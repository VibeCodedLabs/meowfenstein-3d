// Level objectives beyond "clear the pests":
//  - yarn balls: collectibles a level can require before the nap spots open
//  - ornaments: knock them off shelves for a mischief time bonus (very cat)
import * as THREE from 'three';
import { sound } from '../audio.js';

const mats = new Map();
function m(color, extra) {
  const key = color + (extra ? JSON.stringify(extra) : '');
  if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.35, ...extra }));
  return mats.get(key);
}

// ---------------------------------------------------------------- yarn
function yarnTexture(color) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 64, 64);
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * 8 + Math.random() * 3);
    ctx.bezierCurveTo(20, i * 8 - 6, 44, i * 8 + 10, 64, i * 8);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const YARN_COLORS = ['#e63946', '#4cc9f0', '#ffd166', '#9b5de5', '#06d6a0', '#ff8fab'];
export function makeYarn(i = 0) {
  const color = YARN_COLORS[i % YARN_COLORS.length];
  const g = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), new THREE.MeshStandardMaterial({ map: yarnTexture(color), roughness: 1 }));
  ball.position.y = 0.05;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.1, 0.0, 0.05), new THREE.Vector3(0.25, -0.06, 0.12), new THREE.Vector3(0.4, -0.07, 0.0), new THREE.Vector3(0.5, -0.07, -0.15),
  ]);
  const thread = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.008, 5), m(color));
  g.add(ball, thread);
  return g;
}

// ---------------------------------------------------------------- ornaments
const ORNAMENT_NAMES = {
  vase: 'good vase', teacup: 'best teacup', figurine: 'porcelain kitty', plate: 'commemorative plate',
  clock: 'carriage clock', frame: 'photo of Grandpa', snowglobe: 'snow globe', duck: 'ceramic duck',
};

function makeOrnament(kind) {
  const g = new THREE.Group();
  const blue = m('#2f5fa8'), white = m('#f7f4ee'), gold = m('#d4af37', { metalness: 0.8, roughness: 0.25 });
  switch (kind) {
    case 'vase': {
      const pts = [[0.0, 0], [0.07, 0], [0.09, 0.05], [0.1, 0.12], [0.07, 0.2], [0.045, 0.25], [0.06, 0.29]].map(([x, y]) => new THREE.Vector2(x, y));
      g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 18), new THREE.MeshStandardMaterial({ color: '#f2f0ea', roughness: 0.25, side: THREE.DoubleSide })));
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 6, 18), blue);
      band.rotation.x = Math.PI / 2; band.position.y = 0.12;
      g.add(band);
      for (let i = 0; i < 3; i++) {
        const fl = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), m(['#e63946', '#ff8fab', '#ffd166'][i]));
        fl.position.set((i - 1) * 0.035, 0.32, (i % 2) * 0.02);
        g.add(fl);
      }
      break;
    }
    case 'teacup': {
      const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.015, 18), white);
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.04, 0.06, 16, 1, true), new THREE.MeshStandardMaterial({ color: '#f7f4ee', roughness: 0.25, side: THREE.DoubleSide }));
      cup.position.y = 0.04;
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.006, 6, 10), white);
      handle.position.set(0.062, 0.045, 0);
      const rose = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 5), m('#e56b9c'));
      rose.position.set(0, 0.045, 0.052);
      g.add(saucer, cup, handle, rose);
      break;
    }
    case 'figurine': {
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), white);
      body.scale.set(1, 1.2, 0.9); body.position.y = 0.06;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), white);
      head.position.y = 0.14;
      for (const s of [1, -1]) {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.03, 4), white);
        ear.position.set(0.02 * s, 0.175, 0);
        g.add(ear);
      }
      const bow = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.005, 5, 8), m('#e56b9c'));
      bow.position.set(0, 0.11, 0.035);
      g.add(body, head, bow);
      break;
    }
    case 'plate': {
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.012, 24), white);
      plate.rotation.x = Math.PI / 2 - 0.25; plate.position.y = 0.12;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.006, 6, 24), gold);
      rim.rotation.x = -0.25; rim.position.set(0, 0.12, 0.007);
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.06, 18), blue);
      face.rotation.x = -0.25; face.position.set(0, 0.12, 0.008);
      g.add(plate, rim, face);
      break;
    }
    case 'clock': {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.07), gold);
      box.position.y = 0.075;
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.04, 18), white);
      face.position.set(0, 0.085, 0.036);
      g.add(box, face);
      break;
    }
    case 'frame': {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.02), gold);
      frame.position.y = 0.1; frame.rotation.x = -0.15;
      const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.16), m('#a07a5a'));
      pic.position.set(0, 0.1, 0.012); pic.rotation.x = -0.15;
      g.add(frame, pic);
      break;
    }
    case 'snowglobe': {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.04, 16), m('#5a3a28'));
      base.position.y = 0.02;
      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), new THREE.MeshStandardMaterial({ color: '#cfe9ff', transparent: true, opacity: 0.45, roughness: 0.05 }));
      globe.position.y = 0.1;
      const tree = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.06, 8), m('#2f6b2a'));
      tree.position.y = 0.08;
      g.add(base, globe, tree);
      break;
    }
    default: { // ceramic duck
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), m('#a7c957'));
      body.scale.set(1, 0.8, 1.3); body.position.y = 0.05;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), m('#2d6a4f'));
      head.position.set(0, 0.11, 0.05);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.035, 6), m('#f4a261'));
      beak.rotation.x = Math.PI / 2; beak.position.set(0, 0.11, 0.09);
      g.add(body, head, beak);
    }
  }
  return g;
}

export class Ornament {
  constructor(game, kind, x, y, z) {
    this.game = game;
    this.kind = kind;
    this.name = ORNAMENT_NAMES[kind] || 'ornament';
    this.x = x; this.y = y; this.z = z;
    this.state = 'shelf'; // shelf | falling | broken
    this.vel = new THREE.Vector3();
    this.spin = new THREE.Vector3();
    this.model = makeOrnament(kind);
    this.model.position.set(x, y, z);
    this.model.rotation.y = Math.random() * Math.PI * 2;
    game.scene.add(this.model);
  }

  get center() { return new THREE.Vector3(this.x, this.y + 0.1, this.z); }

  // pushed off by a paw, a body or an explosion
  knock(fromX, fromZ, power = 2.4) {
    if (this.state !== 'shelf') return;
    const dx = this.x - fromX, dz = this.z - fromZ, d = Math.hypot(dx, dz) || 1;
    this.vel.set((dx / d) * power, 1.6, (dz / d) * power);
    this.spin.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 12);
    this.state = 'falling';
    sound.swat();
  }

  update(dt) {
    if (this.state !== 'falling') return;
    const g = this.game;
    this.vel.y -= 15 * dt;
    this.x += this.vel.x * dt; this.z += this.vel.z * dt;
    const ny = this.y + this.vel.y * dt;
    const ground = g.physics.groundHeight(this.x, this.z, 0.05, this.y);
    if (g.level.isWall(Math.floor(this.x), Math.floor(this.z), this.y)) { this.vel.x *= -0.3; this.vel.z *= -0.3; this.x -= this.vel.x * dt * 2; this.z -= this.vel.z * dt * 2; }
    if (ny <= ground && this.vel.y < 0) {
      this.y = ground;
      this.shatter();
      return;
    }
    this.y = ny;
    this.model.position.set(this.x, this.y, this.z);
    this.model.rotation.x += this.spin.x * dt;
    this.model.rotation.y += this.spin.y * dt;
    this.model.rotation.z += this.spin.z * dt;
  }

  shatter() {
    this.state = 'broken';
    this.game.scene.remove(this.model);
    this.game.particles.burst(new THREE.Vector3(this.x, this.y + 0.08, this.z), 22, ['#f7f4ee', '#2f5fa8', '#d4af37', '#e56b9c'], 2.2, 0.05, 0.9, 9);
    sound.crash();
    this.game.onOrnamentBroken(this);
  }

  dispose() { this.game.scene.remove(this.model); }
}
