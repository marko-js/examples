# RuneScape Classic

A RuneScape tribute built with [Marko 6](https://markojs.com) and
[@marko/run](https://github.com/marko-js/run), drawn and played the way
RuneScape 2 was: a pitched camera over a textured world, carved stone around
the game, and the numbers the game published.

The whole game runs natively in the browser: the free-to-play world and
Tutorial Island on one 256×256 tile grid, a 600ms tick loop, twenty skills,
melee, ranged and magic combat, prayer, run energy, smithing, banking, shops,
and a save file in `localStorage`. There is no server and no art pipeline —
every model, item icon and texture is drawn from code.

## The world

Misthalin and Asgarnia are a scale drawing of the real thing: every landmark is
written in RuneScape 2 world coordinates and passed through one transform, so
the bearing and the walking distance between any two places are the ones players
remember. Lumbridge sits on the west
bank of the Lum with the bridge east to Al Kharid; the road north runs to
Varrock, whose walls hold the palace, two banks and the shop row. West of the
river are Barbarian Village, Falador and the White Knights' castle, Draynor and
its manor, Port Sarim's docks and Rimmington. Edgeville sits on the edge of the
Wilderness, which covers the north of the map behind its fence. The Dwarven
Mine, Mining Guild, Al Kharid mine and Rimmington mine hold the ore, and the
banks and shops — Bob's axes, Varrock Swords, Lowe's archery, Aubury's runes,
Cassie's shields, Gerrant's fishing supplies and the rest — each keep their own
stock.

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
  your finger — a tap on someone's chest reaches them, not the ground behind.
  A walk drops a yellow cross, something to do drops a red one and names itself
  over the view. **Hold** (or right click) anything for the full menu.
- **Drag** to swing the camera round and tilt it, **pinch** or scroll to zoom,
  and tap the **compass** to face north again. The arrow keys do the same.
- **Tap** an inventory item to wield, eat or bury it. **Hold** it to use, drop
  or examine it.
- Tap the **minimap** to travel further, or the **⛶** button for full screen.
- Use a **tinderbox on logs** to light a fire, then use **raw fish on the fire**
  to cook it.
- Banks are in Varrock, Falador, Draynor, Edgeville and Al Kharid. Shops sell
  what their signs say, and each buys back at its own price.
- The **run orb** doubles your pace and spends energy; the **prayer orb** shows
  what the book has left to burn, and an altar fills it back up.
- The Wilderness runs across the north of the map, past Edgeville.

Trainable skills are Attack, Strength, Defence, Hitpoints, Ranged, Magic,
Prayer, Woodcutting, Fishing, Cooking, Firemaking, Mining and Smithing.
Progress saves every fifteen seconds and can be wiped from the Options tab.

## The numbers

Where the game published a number, this uses it rather than inventing one, and
`tables.server.test.ts` holds them to it: the experience curve and every skill's
rate per action, monster levels and bonuses, equipment bonuses per metal, the
prayer book's levels and drain rates, and the combat maths — effective levels
with the style's invisible bonuses, an attack roll against a defence roll, and a
landed blow rolling anywhere from zero to the max hit.

## How it is put together

The split is deliberate: an imperative engine owns the simulation and paints the
canvas each frame, while Marko owns everything that is not the canvas and
re-renders only when the game says something changed.

- `src/game` — the engine. Plain TypeScript with no DOM dependency, so all of it
  is unit tested in Node.
  - `mainland.ts` places the free-to-play towns from the Classic map's own
    positions and `tutorialgen.ts` lays out Tutorial Island in the sea beside
    them; `worldgen.ts` builds both from a seed, so the server and the browser
    agree on the map without shipping any map data.
  - `tutorial.ts` holds the stages and every line the instructors speak, so the
    script is data the engine walks rather than code.
  - `engine.ts` is the tick loop: pathing, gathering, combat, drops, respawns.
  - `ui.ts` turns game state into a plain `UiState` snapshot, the single value
    every panel renders from.
  - `render/` draws the game view and the minimap onto canvases, sized from
    the surface it is handed so one code path covers a phone and a desktop.
    `projection.ts` is the pitched camera, `world.ts` paints the ground per
    pixel out of a small colour field and sorts everything with height back to
    front, and `actors.ts` and `scenery.ts` build the models out of blocks.
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
