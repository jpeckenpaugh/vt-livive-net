# Vacuum Town

A dependency-free browser game built with HTML, CSS, and Canvas 2D. Swallow small objects to grow large enough to eat the city in a two-minute round.

## Run locally

From this directory, run `python3 -m http.server 5173`, then open http://localhost:5173.

Move with WASD, arrow keys, or the mouse. On touchscreens, drag toward the direction you want to move. Press Escape or the pause button to pause. Personal best scores are stored locally in your browser.

## Files

- `index.html`: game screen and menus
- `style.css`: responsive layout and visual styling
- `game.js`: world generation, rendering, controls, growth, and rounds

No build step is required. Optional web fonts fall back to system sans-serif when offline.

## Maps and mouths

Choose City, Beach, or Downtown before a round. City mixes colorful homes and trees; Beach adds shells, balls, palms, umbrellas, and huts; Downtown adds dense skyscrapers and traffic. Pick Classic Vortex, Cosmic Purple, Shark Bite, or Green Monster. Mouths are cosmetic and share the same growth rules. Choices are remembered locally. Pause and choose “Choose another map” to finish the current round and select again.

Animated rings, randomized tumbling, and synthesized sound effects need no downloaded assets. Toggle sound in the top right.

City and Downtown shuffle building blocks, parks, parking lots, and fountain plazas each round. Benches, planters, flowers, fountains, and parked cars are swallowable. Pedestrians and drivers flee nearby holes along their sidewalk and street routes, then return to their normal pace when safe. Parked cars stay still until threatened.
