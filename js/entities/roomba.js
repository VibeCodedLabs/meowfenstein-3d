// Robot vacuum: trundles around in straight lines and turns when it bumps into
// things. Cats are terrified of it from the side, but you can jump on and ride it.
import * as THREE from 'three';
import { sound } from '../audio.js';

const R = 0.26, TOP = 0.1;

export class Roomba {
  constructor(game, def) {
    this.game = game;
    this.floor = game.level.floorIndex(def.y || 0);
    this.baseY = game.level.floorY[this.floor];
    this.x = def.x; this.z = def.z; this.y = this.baseY;
    this.yaw = def.yaw ?? Math.random() * Math.PI * 2;
    this.speed = def.speed ?? 0.9;
    this.radius = R; this.height = TOP;
    this.dx = 0; this.dz = 0;
    this.turnT = 0; this.turnDir = 1;
    this.spookCd = 0;
    // a moving collider you can stand on (owner lets the cat ride along)
    this.box = game.physics.addBox(0, 0, 0, 0, this.baseY, this.baseY + TOP, 'roomba');
    this.box.owner = this;
    this.syncBox();

    const g = (this.root = new THREE.Group());
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.08, 28), new THREE.MeshStandardMaterial({ color: '#2b2d31', roughness: 0.4, metalness: 0.3 }));
    shell.position.y = 0.045;
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.82, R * 0.82, 0.012, 28), new THREE.MeshStandardMaterial({ color: '#6c7280', roughness: 0.3, metalness: 0.5 }));
    lid.position.y = 0.092;
    const bumper = new THREE.Mesh(new THREE.TorusGeometry(R, 0.018, 6, 28, Math.PI), new THREE.MeshStandardMaterial({ color: '#111' }));
    bumper.rotation.x = Math.PI / 2;
    bumper.rotation.z = Math.PI;
    bumper.position.y = 0.05;
    this.led = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshStandardMaterial({ color: '#33ff66', emissive: '#33ff66', emissiveIntensity: 1 }));
    this.led.position.set(0, 0.1, R * 0.55);
    g.add(shell, lid, bumper, this.led);
    game.scene.add(g);
  }

  syncBox() {
    const b = this.box;
    b.minX = this.x - R * 0.85; b.maxX = this.x + R * 0.85;
    b.minZ = this.z - R * 0.85; b.maxZ = this.z + R * 0.85;
  }

  update(dt) {
    const g = this.game, p = g.player;
    const ox = this.x, oz = this.z;
    this.spookCd -= dt;
    if (this.turnT > 0) {
      this.turnT -= dt;
      this.yaw += this.turnDir * 2.6 * dt;
    } else {
      this.x += Math.sin(this.yaw) * this.speed * dt;
      this.z += Math.cos(this.yaw) * this.speed * dt;
      const bx = this.x, bz = this.z;
      g.physics.resolve(this);
      // bumped into something: back off a touch and spin to a new heading
      if (Math.hypot(this.x - bx, this.z - bz) > 0.002) {
        this.turnT = 0.4 + Math.random() * 0.8;
        this.turnDir = Math.random() < 0.5 ? -1 : 1;
        if (Math.random() < 0.15) sound.beep();
      }
    }
    this.dx = this.x - ox; this.dz = this.z - oz;
    this.syncBox();
    this.root.position.set(this.x, this.baseY, this.z);
    this.root.rotation.y = this.yaw;
    this.led.material.emissiveIntensity = 0.6 + Math.sin(g.clock * 6) * 0.4;

    // brushing past the cat at floor level is terrifying
    const riding = p.groundBox === this.box;
    const d = Math.hypot(p.x - this.x, p.z - this.z);
    if (!riding && this.spookCd <= 0 && d < R + p.radius && Math.abs(p.y - this.baseY) < 0.08 && g.level.floorIndex(p.y) === this.floor) {
      if (p.damage(4, this.x, this.z, 4.5)) g.hud.label('VROOM!', p.labelPos, 'hit', 0.9, 0.6);
      this.spookCd = 1.2;
    }
    return true;
  }

  dispose() {
    this.game.scene.remove(this.root);
    this.game.physics.removeBox(this.box);
  }
}
