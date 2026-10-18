// Keyboard + mouse input. Turning is horizontal only (Wolfenstein style):
// mouse X with pointer lock, or the arrow keys.

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set(); // keys/buttons pressed since last frame
    this.mouseDX = 0;
    this.locked = false;
    this.enabled = false;
    this.onPointerUnlock = null;

    window.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement) return;
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
      if (this.enabled && ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());

    canvas.addEventListener('mousedown', (e) => {
      if (!this.enabled) return;
      if (!this.locked) {
        this.requestLock();
        if (e.button === 0) return; // the first click only grabs the mouse
      }
      this.pressed.add(e.button === 2 ? 'Mouse2' : 'Mouse0');
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('mousemove', (e) => {
      if (this.locked) this.mouseDX += e.movementX;
    });
    document.addEventListener('pointerlockchange', () => {
      const was = this.locked;
      this.locked = document.pointerLockElement === canvas;
      if (was && !this.locked && this.onPointerUnlock) this.onPointerUnlock();
    });
  }

  requestLock() {
    try {
      const p = this.canvas.requestPointerLock();
      if (p && p.catch) p.catch(() => {});
    } catch {
      /* pointer lock unsupported: keyboard turning still works */
    }
  }

  releaseLock() {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  down(...codes) {
    return codes.some((c) => this.keys.has(c));
  }

  hit(...codes) {
    return codes.some((c) => this.pressed.has(c));
  }

  endFrame() {
    this.pressed.clear();
    this.mouseDX = 0;
  }
}

export const CONTROLS = [
  ['W / S', 'Move forward / back'],
  ['A / D', 'Strafe'],
  ['Mouse or ← / →', 'Turn'],
  ['Space', 'Jump (watch your fatigue!)'],
  ['Left click / J', 'Swat with paw'],
  ['Right click / K', 'Throw squeaky toy'],
  ['E', 'Meow (humans give fish & toys)'],
  ['Shift', 'Sneak (harder for the dog to spot)'],
  ['Q', 'Unleash Nyan Mode (after a kill streak)'],
  ['Esc / P', 'Pause'],
];
