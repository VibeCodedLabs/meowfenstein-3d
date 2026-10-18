// All playable levels, in order. Add new levels here.
import { HOUSE } from './house.js';
import { GARDEN } from './garden.js';

export const LEVELS = [HOUSE, GARDEN];

export function getLevel(id) {
  return LEVELS.find((l) => l.id === id) || LEVELS[0];
}

export function nextLevel(id) {
  const i = LEVELS.findIndex((l) => l.id === id);
  return i >= 0 && i < LEVELS.length - 1 ? LEVELS[i + 1] : null;
}
