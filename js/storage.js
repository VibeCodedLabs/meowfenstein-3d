// Leaderboard + settings persistence. Every storage access is wrapped so the
// game still runs in private windows or when site data is blocked.

const PREFIX = 'meowfenstein.';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable: keep going */
  }
}

export function getLeaderboard(levelId) {
  const list = read('leaderboard.' + levelId, []);
  return Array.isArray(list) ? list : [];
}

// Returns the index of the new entry in the sorted board (or -1 if it fell off).
export function addLeaderboardEntry(levelId, entry) {
  const list = getLeaderboard(levelId);
  const stamped = { ...entry, id: Date.now() + Math.random() };
  list.push(stamped);
  list.sort((a, b) => a.time - b.time);
  const top = list.slice(0, 10);
  write('leaderboard.' + levelId, top);
  return top.findIndex((e) => e.id === stamped.id);
}

const DEFAULT_SETTINGS = { volume: 0.7, sensitivity: 1, music: true, fullscreen: true, name: '', hat: 'none' };

export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...read('settings', {}) };
}

export function saveSettings(settings) {
  write('settings', settings);
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
}
