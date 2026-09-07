# RuneScape Classic

A RuneScape tribute built with [Marko 6](https://markojs.com) and
[@marko/run](https://github.com/marko-js/run): RuneScape 2 mechanics wearing
RuneScape Classic's flat, chunky look.

The whole game runs natively in the browser: Tutorial Island and a mainland on
one 216×216 tile grid, a 600ms tick loop, twenty skills, melee, ranged and
magic combat, smithing, banking, shops, and a save file in `localStorage`.
There is no server and no art pipeline — every sprite, item icon and tile is
drawn from code.

## Tutorial Island

New characters wake up in the starting house and are walked through the RS2
tutorial, one instructor and one gated door at a time: the Gielinor Guide, the
Survival Expert's pond, the Master Chef's kitchen, the Quest Guide, the mine
(where you smelt a bar and hammer out a dagger), the rat pit for melee and
ranged, the bank, the chapel, and the Magic Instructor who sends you to
Lumbridge. Every door stays shut until its stage is done, and nothing on the
island can kill you.

## Installation

```sh
npm init marko -- --template runescape-classic
```

Then `npm run dev` and open the printed URL.

## Playing

Built for a phone first: the game fills the screen, the minimap, chat and tabs
sit over it, and every control works by touch.

- **Tap** the world to walk, or to run the first action on whatever is under
  your finger. **Hold** (or right click) anything for the full menu.
- **Tap** an inventory item to wield, eat or bury it. **Hold** it to use, drop
  or examine it.
- Tap the **minimap** to travel further, or the **⛶** button for full screen.
- Use a **tinderbox on logs** to light a fire, then use **raw fish on the fire**
  to cook it.
- Bank chests are north east of the Lumbridge crossroads, the general store is
  south east, the mine is west, and goblins are across the Lum bridge.

Trainable skills are Attack, Defense, Strength, Hits, Prayer (bury bones),
Cooking, Woodcut, Fishing, Firemaking and Mining. Progress saves every fifteen
seconds and can be wiped from the Options tab.

## How it is put together

The split is deliberate: an imperative engine owns the simulation and paints the
canvas each frame, while Marko owns everything that is not the canvas and
re-renders only when the game says something changed.

- `src/game` — the engine. Plain TypeScript with no DOM dependency, so all of it
  is unit tested in Node.
  - `worldgen.ts` builds the world from a seed, so the server and the browser
    agree on the map without shipping any map data; `tutorialgen.ts` lays out
    Tutorial Island beside it.
  - `tutorial.ts` holds the stages and every line the instructors speak, so the
    script is data the engine walks rather than code.
  - `engine.ts` is the tick loop: pathing, gathering, combat, drops, respawns.
  - `ui.ts` turns game state into a plain `UiState` snapshot, the single value
    every panel renders from.
  - `render/` draws the game view and the minimap onto canvases, sized from
    the surface it is handed so one code path covers a phone and a desktop.
- `src/tags` — the HUD, overlaid on the canvas. `<game-client>` creates the engine in a
  [`<lifecycle>`](https://markojs.com/docs/reference/core-tag#lifecycle) hook,
  drives `requestAnimationFrame`, and assigns each new snapshot to a
  [`<let>`](https://markojs.com/docs/reference/core-tag#let). Panels are pure
  functions of that snapshot.
- `src/routes` — a single page. The server renders the full interface from
  `initialUi()`, a snapshot of a fresh character that needs no world, then the
  browser resumes it and swaps in the real save.

Because the panels only depend on the snapshot, sixty frames a second of canvas
animation costs nothing in Marko: the reactive graph only runs when the
inventory, stats, chat or an overlay actually change.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` then `npm start` — build and run the production server
- `npm test` — run tests with Vitest
- `npm run storybook` — develop panels in Storybook
- `npm run lint` / `npm run format` — type-check, lint, and format

Not affiliated with or endorsed by Jagex.
