# Meowfenstein 3D

An over-the-shoulder, Wolfenstein-style cat game in the browser (Three.js, no build step, no asset files).

Clear each level of rats and swooping magpies, dodge Brutus the dog, meow at humans for fish, then
find a sunny nap spot before sunset.

- **Level 1: The House**: nap in the Sunroom cat bed or on top of the lounge cat tree.
- **Level 2: The Garden**: nap on the sun lounger or the warm shed roof (climb the compost and wheelie
  bins). The trampoline bounces you high, and cats hate water: ponds and paddling pools slow you down.

## Play

Double-click `play.bat` (needs Python), or from this folder:

```
python -m http.server 8123
```

then open http://localhost:8123. Needs internet the first time (Three.js loads from a CDN).

## Controls

| Key | Action |
| --- | --- |
| W / S | Move forward / back |
| A / D | Strafe |
| Mouse or Left / Right arrows | Turn (horizontal only, like the original Wolfenstein). If the browser won't capture the mouse, rest the cursor at a screen edge to keep turning |
| Space | Jump (each jump adds fatigue) |
| Left click / Z / J | Swat |
| Right click / X / K | Throw a squeaky toy (explodes, squeaks) |
| E / C | Meow (humans toss fish, or toys when you're healthy) |
| Shift | Sneak (the dog spots you more slowly, from closer) |
| Q | Nyan Mode, once charged by a 3-kill streak |
| F | Toggle fullscreen (keeps the mouse inside the game) |
| Esc / P | Pause |

## Where things live

- `js/level/levels.js`: the list of levels, in order (add new ones here)
- `js/level/house.js`, `js/level/garden.js`: each level's ASCII tile map, room/wall looks, furniture,
  spawns, humans, nap spots and time limit
- `js/level/map.js`: tile-map queries and pathfinding; `js/level/builder.js`: turns a map into meshes
- `js/models/cat.js`: the cat model and animations; `FURS` holds coat colours for future fur designs
- `js/models/hats.js`: the hat wardrobe (add a builder + an entry in `HATS`)
- `js/entities/`: player, rats/magpies, dog AI, humans/pickups/projectiles/rainbow
- `js/audio.js`: all synthesized sounds + the Nyan chiptune. Set `CUSTOM_NYAN_TRACK` to use your own audio file.
- Leaderboard and settings are saved in the browser's localStorage.
