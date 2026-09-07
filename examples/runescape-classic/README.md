# RuneScape Classic

A tribute to [RuneScape Classic](https://en.wikipedia.org/wiki/RuneScape#RuneScape_Classic),
built with [Marko 6](https://markojs.com) and [@marko/run](https://github.com/marko-js/run).

The whole game runs natively in the browser: a 128×128 tile island, a 600ms
tick loop, eighteen skills, combat, banking, shops, and a save file in
`localStorage`. There is no server and no art pipeline — every sprite, item icon
and tile is drawn from code.

## Installation

```sh
npm init marko -- --template runescape-classic
```

Then `npm run dev` and open the printed URL.

## Playing

- **Left click** the world to walk, or to run the first action on whatever is
  under the pointer. **Right click** anything for the full menu.
- **Left click** an inventory item to wield, eat or bury it. **Right click** it
  to use, drop or examine it.
- Click the **minimap** to walk somewhere further away.
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
  - `worldgen.ts` builds the island from a seed, so the server and the browser
    agree on the map without shipping any map data.
  - `engine.ts` is the tick loop: pathing, gathering, combat, drops, respawns.
  - `ui.ts` turns game state into a plain `UiState` snapshot, the single value
    every panel renders from.
  - `render/` draws the game view and the minimap onto canvases.
- `src/tags` — the interface. `<game-client>` creates the engine in a
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
