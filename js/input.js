// Keyboard + mouse input. Turning is horizontal only (Wolfenstein style).
//
// Mouse look works two ways:
//  - captured (pointer lock): unlimited mouse-look, cursor hidden.
//  - free cursor: used when the browser refuses pointer lock (some browsers and
//    embedded views do). Mouse movement still turns the cat, and parking the
//    cursor near the left/right screen edge keeps turning so you never run out
//    of room.

const EDGE = 0.72; // fraction of half-screen where edge-turning starts
const OUTSIDE_GRACE = 1200; // ms to keep turning after the cursor slips out past a side edge

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressed = new Set(); // keys/buttons pressed since last frame
    this.mouseDX = 0;
    this.cursorX = null; // -1 (left edge) .. 1 (right edge), null when outside the window
    this.leftWindowAt = 0; // when the cursor last left through a side edge
    this.locked = false;
    this.lockFailed = false;
    this.lockError = ''; // why the browser refused capture, for the pause screen
    this.enabled = false;
    this.onPointerUnlock = null;

    window.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement) return;
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
      if (this.enabled && ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => { this.keys.clear(); this.cursorX = null; });

    canvas.addEventListener('mousedown', (e) => {
      if (!this.enabled) return;
      if (!this.locked) this.requestLock();
      // every click counts, captured or not
      this.pressed.add(e.button === 2 ? 'Mouse2' : 'Mouse0');
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('mousemove', (e) => {
      if (this.locked) {
        this.mouseDX += e.movementX;
        return;
      }
      this.cursorX = (e.clientX / window.innerWidth) * 2 - 1;
      this.leftWindowAt = 0;
      // ignore the jump some browsers report when the cursor re-enters the window
      if (this.enabled) this.mouseDX += Math.max(-120, Math.min(120, e.movementX || 0));
    });
    document.addEventListener('mouseout', (e) => {
      if (e.relatedTarget) return;
      // slipped out the left/right side while turning: keep turning for a moment
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      if (Math.abs(x) > 0.6) { this.cursorX = Math.sign(x); this.leftWindowAt = performance.now(); }
      else this.cursorX = null;
    });
    document.addEventListener('pointerlockchange', () => {
      const was = this.locked;
      this.locked = document.pointerLockElement === canvas;
      if (this.locked) { this.lockFailed = false; this.lockError = ''; this.lockWorked = true; }
      if (was && !this.locked && this.onPointerUnlock) this.onPointerUnlock();
    });
    document.addEventListener('pointerlockerror', () => { this.lockFailed = true; this.lockError ||= 'pointerlockerror event (no details given)'; });
  }

  requestLock() {
    const fail = (err) => {
      this.lockFailed = true;
      this.lockError = err && err.name ? `${err.name}: ${err.message}` : String(err || 'unknown');
      console.warn('[Meowfenstein] mouse capture refused:', this.lockError);
    };
    if (!this.canvas.requestPointerLock) return fail('requestPointerLock is not supported');
    try {
      const p = this.canvas.requestPointerLock();
      if (p && p.catch) p.catch(fail);
    } catch (err) {
      fail(err);
    }
  }

  releaseLock() {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  // -1..1 turn request from parking the free cursor near a screen edge
  get edgeTurn() {
    if (this.locked || !this.enabled || this.cursorX === null) return 0;
    if (this.leftWindowAt && performance.now() - this.leftWindowAt > OUTSIDE_GRACE) return 0;
    const a = Math.abs(this.cursorX);
    if (a < EDGE) return 0;
    return Math.sign(this.cursorX) * Math.min(1, (a - EDGE) / (0.97 - EDGE));
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
  ['Mouse or ← / →', 'Turn (park the cursor at a screen edge to keep turning)'],
  ['Space', 'Jump (watch your fatigue!)'],
  ['Left click / Z / J', 'Swat with paw'],
  ['Right click / X / K', 'Throw squeaky toy'],
  ['E / C', 'Meow (humans give fish & toys)'],
  ['Shift', 'Sneak (harder for the dog to spot)'],
  ['Q', 'Unleash Nyan Mode (after a kill streak)'],
  ['F', 'Toggle fullscreen (keeps the mouse inside the game)'],
  ['Esc / P', 'Pause'],
];
