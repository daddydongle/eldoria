# Eldoria: Confluence

A dependency-free Canvas starter prototype for a fantasy action RPG. The opening tutorial begins in an Eldorian meadow, introduces an intentionally unwinnable Blood Cult encounter, and continues with a prison escape and optional Blood Essence pickup.

## Play locally

Open `index.html` directly, or serve the folder with any static web server (for example `python -m http.server 8000`) and visit `http://localhost:8000`.

## Controls

- **WASD / arrows** — move
- **Shift** — sprint
- **Q** — dash
- **Space or J** — unarmed/knife attack
- **H** — block/use shield
- **F** — interact
- **O** — inventory
- **` 1 2 3 4 5 6 7 8 9 0 - = E R T Y U I [** — ability slots 1–20. The requested sequence supplies 19 distinct keys, so `[` completes slot 20.

## Tutorial flow

1. Dismiss the arrival message in the flowered meadow.
2. Receive **New objective: Survive** and face Blood Cultists, a Blood Priestess, and the High Priest. The encounter is deliberately unwinnable.
3. Wake in a prison cell after the defeat fade.
4. Search the meal tray with **F** to find a knife, then use it at the barred door.
5. Pick up the Blood Essence. It is stored in the searchable/filterable inventory and is never consumed automatically.

## Architecture

- `index.html` — Canvas, HUD, story, inventory, and confluence overlays
- `styles.css` — responsive dark-fantasy presentation and placeholder gem-convergence animation
- `data.js` — canonical 20-essence/100-ability catalogue, 20-key mapping, and progression rules
- `game.js` — game loop, input, combat, enemy AI, state transitions, prison interaction, and inventory
- `assets/characters/player/default/player-atlas.png` — four-direction base atlas for idle, block, and defeated states
- `assets/characters/player/default/{walk,sprint,attack}.png` — dedicated eight-frame transparent motion atlases; attack cells include extra sword-effect padding

The progression model enforces three core essences plus one confluence essence. Completing the build unlocks the first ability from each essence (four total); awakening stones then unlock the remaining sixteen, producing twenty abilities in the build. Mechanical implementations for essence abilities are intentionally scaffolded for later development.

## GitHub Pages

This repository is already static-site ready. In GitHub, open **Settings → Pages**, choose **Deploy from a branch**, then select `main` and `/ (root)`. No build step is required.

## License

Prototype source provided for the project owner. Add a project-specific license before public distribution.
