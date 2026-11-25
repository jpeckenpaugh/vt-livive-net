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

## Coins and shop

New wallets start with 100 welcome coins. City and Classic Vortex are free. Each swallowed object earns `1 + floor(points / 15)` coins, each full size milestone earns 25, and completing a round earns another 25. Earnings save immediately, even if you leave a round early.

Open the coin button in the header to buy permanent map and mouth unlocks, or Golden Wake and Amber Aura cosmetics. Opening the shop pauses an active round and closing it resumes play. Choose an unlocked extra in the setup menu; use “No extra” to remove it. Locked maps become available for the next round.

Coins, purchases, and equipped extras are stored in this browser on this site. They do not sync between devices or between localhost and the published site. Clearing browser data resets progress. If storage is unavailable, progress lasts only for the current visit. There are no real-money purchases.

Run the economy and reward checks with `node --test tests/economy.test.cjs`. The game still requires no build or dependency installation.
