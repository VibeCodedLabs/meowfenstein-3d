// All playable levels, in order. Add new levels here.
import { HOUSE } from './house.js';
import { GARDEN } from './garden.js';
import { PARK } from './park.js';
import { GRANDMA } from './grandma.js';

export const LEVELS = [HOUSE, GARDEN, PARK, GRANDMA];

export function getLevel(id) {
  return LEVELS.find((l) => l.id === id) || LEVELS[0];
}

export function nextLevel(id) {
  const i = LEVELS.findIndex((l) => l.id === id);
  return i >= 0 && i < LEVELS.length - 1 ? LEVELS[i + 1] : null;
}
