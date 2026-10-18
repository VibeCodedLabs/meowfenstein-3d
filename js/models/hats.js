// Hat wardrobe. Each builder returns a Group sitting on y = 0 at the top of the
// cat's head (head radius ~0.135). userData.animate(dt, speed) is optional.
import * as THREE from 'three';

export const HATS = [
  { id: 'none', name: 'No hat' },
  { id: 'fez', name: 'Fez' },
  { id: 'spinny', name: 'Spinny Hat' },
  { id: 'spiky', name: 'Spiky Hat' },
  { id: 'tophat', name: 'Top Hat' },
  { id: 'cap', name: 'Baseball Cap' },
  { id: 'foamfinger', name: 'Foam Finger Hat' },
  { id: 'beer', name: 'Beer Hat' },
  { id: 'bowler', name: 'Bowler Hat' },
  { id: 'beanie', name: 'Beanie' },
  { id: 'cone', name: 'Traffic Cone' },
];

const m = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...extra });

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, mat);
  o.position.set(x, y, z);
  return o;
}

function dome(r, mat, squashY = 1) {
  const o = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  o.scale.y = squashY;
  return o;
}

function labelTexture(text, bg, fg) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = fg;
  ctx.font = 'bold 64px Trebuchet MS, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 64, 68);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const builders = {
  fez(g) {
    const red = m('#b3202a', { roughness: 0.9 });
    g.add(mesh(new THREE.CylinderGeometry(0.07, 0.092, 0.13, 24), red, 0, 0.055, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 8), m('#111'), 0, 0.125, 0));
    const cord = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.09, 6), m('#111'), 0.04, 0.09, 0);
    cord.rotation.z = -0.9;
    g.add(cord);
    const tassel = mesh(new THREE.CylinderGeometry(0.006, 0.018, 0.06, 8), m('#111'), 0.08, 0.04, 0);
    g.add(tassel);
    g.userData.animate = (dt, speed) => {
      g.userData.t = (g.userData.t || 0) + dt;
      tassel.rotation.z = Math.sin(g.userData.t * (3 + speed)) * 0.25;
    };
  },

  spinny(g) {
    const cols = ['#e63946', '#ffd166', '#118ab2', '#06d6a0'];
    for (let i = 0; i < 4; i++) {
      const q = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8, (i * Math.PI) / 2, Math.PI / 2, 0, Math.PI / 2), m(cols[i]));
      q.scale.y = 0.75;
      g.add(q);
    }
    g.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 6), m('#999', { metalness: 0.6 }), 0, 0.1, 0));
    const prop = new THREE.Group();
    prop.position.y = 0.125;
    const bladeMat = m('#ffd166');
    const b1 = mesh(new THREE.BoxGeometry(0.2, 0.006, 0.035), bladeMat);
    const b2 = mesh(new THREE.BoxGeometry(0.035, 0.006, 0.2), m('#e63946'));
    b1.rotation.x = 0.25; b2.rotation.z = 0.25;
    prop.add(b1, b2, mesh(new THREE.SphereGeometry(0.014, 8, 6), m('#118ab2')));
    g.add(prop);
    g.userData.animate = (dt, speed) => { prop.rotation.y += dt * (6 + speed * 8); };
  },

  spiky(g) {
    const black = m('#151515', { roughness: 0.5 });
    g.add(dome(0.11, black, 0.7));
    const spike = m('#d8d8d8', { metalness: 0.9, roughness: 0.25 });
    const spots = [[0, 0.08, 0, 0, 0], [0.06, 0.055, 0, 0, -0.6], [-0.06, 0.055, 0, 0, 0.6], [0, 0.055, 0.06, 0.6, 0], [0, 0.055, -0.06, -0.6, 0],
      [0.05, 0.04, 0.05, 0.5, -0.5], [-0.05, 0.04, 0.05, 0.5, 0.5], [0.05, 0.04, -0.05, -0.5, -0.5], [-0.05, 0.04, -0.05, -0.5, 0.5]];
    for (const [x, y, z, rx, rz] of spots) {
      const c = mesh(new THREE.ConeGeometry(0.018, 0.07, 8), spike, x, y + 0.03, z);
      c.rotation.set(rx, 0, rz);
      g.add(c);
    }
  },

  tophat(g) {
    const black = m('#111', { roughness: 0.5 });
    g.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.012, 28), black, 0, 0.006, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.085, 0.08, 0.2, 28), black, 0, 0.11, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.0825, 0.082, 0.03, 28), m('#b3202a'), 0, 0.03, 0));
  },

  cap(g) {
    const col = m('#1f4e9c');
    g.add(dome(0.115, col, 0.75));
    const bill = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.012, 20, 1, false, -Math.PI / 2, Math.PI), col, 0, 0.012, 0.06);
    bill.scale.z = 1.3;
    bill.rotation.x = 0.12;
    g.add(bill);
    g.add(mesh(new THREE.SphereGeometry(0.012, 8, 6), m('#e63946'), 0, 0.086, 0));
    const logo = mesh(new THREE.CircleGeometry(0.03, 16), m('#ffffff'), 0, 0.045, 0.104);
    logo.rotation.x = -0.5;
    g.add(logo);
  },

  foamfinger(g) {
    const foam = m('#ffd400', { roughness: 1 });
    const band = mesh(new THREE.TorusGeometry(0.11, 0.012, 8, 24), m('#1f4e9c'));
    band.rotation.x = Math.PI / 2;
    g.add(band);
    const hand = new THREE.Group();
    hand.position.y = 0.01;
    const palm = mesh(new THREE.BoxGeometry(0.13, 0.12, 0.06), [foam, foam, foam, foam, new THREE.MeshStandardMaterial({ map: labelTexture('#1', '#ffd400', '#1f4e9c') }), foam], 0, 0.08, 0);
    const finger = mesh(new THREE.CapsuleGeometry(0.022, 0.12, 4, 8), foam, 0.035, 0.22, 0);
    const thumb = mesh(new THREE.CapsuleGeometry(0.02, 0.05, 4, 8), foam, -0.075, 0.1, 0.01);
    thumb.rotation.z = 0.8;
    const knuckles = mesh(new THREE.CapsuleGeometry(0.03, 0.06, 4, 8), foam, -0.015, 0.15, 0.012);
    knuckles.rotation.z = Math.PI / 2;
    const cuff = mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.04, 16), m('#1f4e9c'), 0, 0.02, 0);
    hand.add(palm, finger, thumb, knuckles, cuff);
    g.add(hand);
    g.userData.animate = (dt) => {
      g.userData.t = (g.userData.t || 0) + dt;
      hand.rotation.z = Math.sin(g.userData.t * 4) * 0.12;
    };
  },

  beer(g) {
    const helmet = m('#e8b923', { roughness: 0.4 });
    g.add(dome(0.12, helmet, 0.8));
    g.add(mesh(new THREE.CylinderGeometry(0.124, 0.124, 0.015, 24), helmet, 0, 0.005, 0));
    const tube = m('#ffffff', { transparent: true, opacity: 0.85 });
    for (const s of [1, -1]) {
      const can = new THREE.Group();
      can.position.set(0.14 * s, 0.07, 0);
      can.rotation.z = Math.PI; // upside down
      const body = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.11, 16), m(s > 0 ? '#c8102e' : '#1d5fbf', { metalness: 0.6, roughness: 0.3 }));
      const rimA = mesh(new THREE.CylinderGeometry(0.032, 0.035, 0.01, 16), m('#ccc', { metalness: 0.9, roughness: 0.2 }), 0, 0.06, 0);
      can.add(body, rimA);
      g.add(can);
      g.add(mesh(new THREE.BoxGeometry(0.04, 0.03, 0.05), m('#333'), 0.11 * s, 0.05, 0));
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.14 * s, 0.01, 0),
        new THREE.Vector3(0.15 * s, -0.08, 0.05),
        new THREE.Vector3(0.1 * s, -0.17, 0.12),
        new THREE.Vector3(0.02 * s, -0.19, 0.15),
      ]);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.006, 6), tube));
    }
  },

  bowler(g) {
    const felt = m('#2b2118', { roughness: 0.8 });
    g.add(mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.01, 28), felt, 0, 0.005, 0));
    const brim = mesh(new THREE.TorusGeometry(0.133, 0.01, 8, 28), felt, 0, 0.012, 0);
    brim.rotation.x = Math.PI / 2;
    g.add(brim);
    const crown = dome(0.09, felt, 1.0);
    crown.position.y = 0.02;
    g.add(crown);
    g.add(mesh(new THREE.CylinderGeometry(0.091, 0.091, 0.025, 28), felt, 0, 0.02, 0));
    g.add(mesh(new THREE.CylinderGeometry(0.0915, 0.0915, 0.018, 28), m('#111'), 0, 0.028, 0));
  },

  beanie(g) {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ctx = c.getContext('2d');
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? '#f1f1f1' : '#d62839';
      ctx.fillRect(0, i * 8, 64, 8);
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    for (let x = 0; x < 64; x += 4) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 64); ctx.stroke(); }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const knit = m('#ffffff', { map: tex, roughness: 1 });
    const top = dome(0.12, knit, 1.0);
    g.add(top);
    g.add(mesh(new THREE.CylinderGeometry(0.124, 0.126, 0.05, 24), m('#d62839', { roughness: 1 }), 0, 0.01, 0));
    g.add(mesh(new THREE.SphereGeometry(0.04, 12, 10), m('#f1f1f1', { roughness: 1 }), 0, 0.135, 0));
  },

  cone(g) {
    const orange = m('#ff6a13', { roughness: 0.5 });
    const white = m('#ffffff', { roughness: 0.4 });
    g.add(mesh(new THREE.BoxGeometry(0.24, 0.02, 0.24), m('#222'), 0, 0.01, 0));
    g.add(mesh(new THREE.ConeGeometry(0.105, 0.3, 24), orange, 0, 0.17, 0));
    // stripes: short frustums matching the cone's slope
    const r = (y) => 0.105 * (1 - (y - 0.02) / 0.3) + 0.003;
    for (const y of [0.11, 0.2]) {
      g.add(mesh(new THREE.CylinderGeometry(r(y + 0.025), r(y - 0.025), 0.05, 24), white, 0, y, 0));
    }
  },
};

export function buildHat(id) {
  if (!id || id === 'none' || !builders[id]) return null;
  const g = new THREE.Group();
  builders[id](g);
  return g;
}
