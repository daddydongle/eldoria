# Eldoria: Confluence

## Combat and Willowbrook update

- Attacks have wind-up, directional reach, recovery and stamina costs. Face the enemy before striking. Hits no longer cancel enemy wind-ups, so holding attack cannot stun-lock them.
- Blocking protects your front, costs stamina, and fails when exhausted. Dash out of the red attack warnings. Stamina regenerates after a short rest; attacking slows movement.
- Hold **Tab** for the weapon wheel. Hover a weapon (or use arrow keys) and release Tab to equip. Unfound weapons are locked. Combat pauses while selecting; switching is unavailable mid-attack.
- Unarmed punches, quick knife thrusts, sweeping sword strikes and slower axe chops use distinct procedural weapon motion, reach, damage and timing. These are not new full-body sprite animation sheets.
- The character climbs out of sight before the stair fade. Leaving the cauldron room now enters **Willowbrook**, an explorable rural district with cottages, wheat fields, a well, resident dialogue and a smithy.
- At the smithy's outdoor rack, press **F** to borrow a sword and wood axe, then choose either in the wheel. The town is a safe starter area; building interiors and further quests are not implemented.
- `adventure.js` and `adventure.css` contain the new combat/equipment systems, stair sequence and town. Include both when uploading the game.
- `work/check-adventure.cjs` tests enemy retaliation during held attacks, Tab hold/release, stair fade ordering, town entry and weapon collection. The older escape smoke test predates timed/directional combat and is superseded for this route.

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
- **I** — inventory; Escape closes it
- **1–8** — eight ability slots, two adjacent slots per essence (effects remain scaffolding).

## Tutorial flow

1. Dismiss the arrival message in the flowered meadow.
2. Receive **New objective: Survive** and face Blood Cultists, a Blood Priestess, and the High Priest. The encounter is deliberately unwinnable.
3. Wake in a prison cell after the defeat fade.
4. Search the meal tray with **F** to find a knife, then use it at the barred door.
5. Pick up the Blood Essence. It is stored in the searchable/filterable inventory and is never consumed automatically.
6. Fight three guards in the north hallway with the knife. Red circles warn of attacks; block or dash to avoid damage.
7. Walk up the stairs at the far end after defeating the guards.
8. Enter the upper sanctum with its giant pot of bubbling red liquid. Defeat two more guards, go around the pot, and press F at the north exit.

Defeat during the escape offers a retry from the cell with collected equipment retained. Reloading resets progress. Blood Essence consumption is a dormant story flag, not an automatic core-essence selection.

## Architecture

- `index.html` — Canvas, HUD, story, inventory, and confluence overlays
- `styles.css` — responsive dark-fantasy presentation and placeholder gem-convergence animation
- `data.js` — 20 essence choices with two abilities each, eight-key mapping, and progression rules
- `game.js` — game loop, input, combat, enemy AI, state transitions, prison interaction, and inventory
- `environment.js` — cached meadow scenery, depth-sorted trees, stone prison, torchlight, and pickup artwork; no external art downloads required
- `assets/characters/player/default/player-atlas.png` — four-direction base atlas for idle, block, and defeated states
- `assets/characters/player/default/{walk,sprint,attack}.png` — dedicated eight-frame transparent motion atlases; attack cells include extra sword-effect padding

The progression model enforces three core essences plus one confluence essence. Each uses the first two originally specified abilities. Completing the build unlocks one base ability per essence; four awakening stones unlock the other four, producing eight abilities per build. Mechanical implementations remain scaffolded.

New generated skins are in `assets/characters/enemies/blood-cult.png` and standing poses in `assets/characters/player/default/idle-directions.png`. Enemy movement uses mirrored skins and a subtle bob, not full directional animation sheets. Idle artwork is an interpretation of the existing character. Both walk and sprint use sprint.png at one scale with different playback/travel speeds. Knife strikes use a compact procedural blade effect; older atlases remain as unused assets.

The Playwright smoke test `work/check-escape.cjs` verifies inventory, knife damage, capture, corridor guards, stairs, vat room, final exit and eight-ability progression using accelerated positioning. It requires Playwright, Edge, and a server at port 8766; this is not a complete manual difficulty playtest.

## GitHub Pages

This repository is already static-site ready. In GitHub, open **Settings → Pages**, choose **Deploy from a branch**, then select `main` and `/ (root)`. No build step is required.

Extract the entire ZIP before playing. Upload the folder contents, including all JavaScript, CSS and assets, not just index.html. Serving over HTTP is recommended for precise automatic sprite trimming; local-file browser restrictions may use less precise fallback bounds.

## License

Prototype source provided for the project owner. Add a project-specific license before public distribution.
