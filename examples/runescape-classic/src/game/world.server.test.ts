import { RESPAWN_TILE, TUTORIAL_START } from "./config";
import { PLACES, WORLD_PLACES } from "./mainland";
import { adjacentTile, chebyshev, findPath } from "./pathfinding";
import { inBounds, isWalkable, objectAt, TERRAIN, terrainAt } from "./world";
import { generateWorld } from "./worldgen";

const map = generateWorld();

/** Every tile you can walk to from a starting point. */
function reachableFrom(start: { x: number; y: number }): Uint8Array {
  const seen = new Uint8Array(map.size * map.size);
  const queue = [start];
  seen[start.y * map.size + start.x] = 1;
  while (queue.length) {
    const tile = queue.pop()!;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const x = tile.x + dx;
      const y = tile.y + dy;
      if (!inBounds(map, x, y) || seen[y * map.size + x]) continue;
      if (!isWalkable(map, x, y)) continue;
      seen[y * map.size + x] = 1;
      queue.push({ x, y });
    }
  }
  return seen;
}

const fromLumbridge = reachableFrom(RESPAWN_TILE);
const fromTutorial = reachableFrom(TUTORIAL_START);

/** True when a walkable tile beside the object is in `seen`. */
function servedBy(seen: Uint8Array, object: { x: number; y: number }): boolean {
  return [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ].some(([dx, dy]) => seen[(object.y + dy) * map.size + object.x + dx] === 1);
}

const onTutorialIsland = (object: { x: number; y: number }) =>
  object.x >= 176 && object.y >= 176;

test("generation is deterministic for a seed", () => {
  const again = generateWorld();
  expect(Array.from(again.terrain)).toEqual(Array.from(map.terrain));
});

test("every free-to-play town can be walked to from Lumbridge", () => {
  for (const [name, at] of Object.entries(PLACES)) {
    if (name === "miningGuild") continue; // an open pit, not a walkable marker
    const reached =
      fromLumbridge[at.y * map.size + at.x] === 1 ||
      servedBy(fromLumbridge, at);
    expect(`${name}: ${reached ? "reachable" : "cut off"}`).toBe(
      `${name}: reachable`,
    );
  }
});

test("the grid is a scale drawing of the real world map", () => {
  const pairs: [keyof typeof WORLD_PLACES, keyof typeof WORLD_PLACES][] = [
    ["lumbridge", "varrock"],
    ["lumbridge", "draynor"],
    ["falador", "portSarim"],
    ["varrock", "edgeville"],
    ["portSarim", "rimmington"],
    ["lumbridge", "alKharid"],
  ];
  for (const [from, to] of pairs) {
    const world = Math.hypot(
      WORLD_PLACES[to][0] - WORLD_PLACES[from][0],
      WORLD_PLACES[to][1] - WORLD_PLACES[from][1],
    );
    const grid = Math.hypot(
      PLACES[to].x - PLACES[from].x,
      PLACES[to].y - PLACES[from].y,
    );
    // One grid tile stands for a fixed number of real ones, everywhere;
    // the slack is only the rounding onto whole tiles.
    expect(grid / world).toBeCloseTo(0.36, 1);
  }
});

test("the towns sit where the Classic map puts them", () => {
  expect(PLACES.varrock.y).toBeLessThan(PLACES.lumbridge.y); // Varrock is north
  expect(PLACES.falador.x).toBeLessThan(PLACES.varrock.x); // Falador is west
  expect(PLACES.portSarim.y).toBeGreaterThan(PLACES.falador.y); // and south of it
  expect(PLACES.rimmington.x).toBeLessThan(PLACES.portSarim.x);
  expect(PLACES.draynor.x).toBeLessThan(PLACES.lumbridge.x);
  expect(PLACES.alKharid.x).toBeGreaterThan(PLACES.lumbridge.x); // over the Lum
  expect(PLACES.edgeville.y).toBeLessThan(PLACES.varrock.y); // borders the Wilderness
});

test("every shop counter and bank on the mainland can be reached", () => {
  const serve = ["shop_counter", "bank_chest", "furnace", "anvil", "range"];
  for (const object of map.objects) {
    if (!object || onTutorialIsland(object)) continue;
    if (!serve.includes(object.defId)) continue;
    const label = `${object.defId} at ${object.x},${object.y}`;
    expect(
      `${label}: ${servedBy(fromLumbridge, object) ? "served" : "cut off"}`,
    ).toBe(`${label}: served`);
  }
});

test("Tutorial Island is its own island, cut off from the mainland", () => {
  expect(fromTutorial[RESPAWN_TILE.y * map.size + RESPAWN_TILE.x]).toBe(0);
  expect(fromLumbridge[TUTORIAL_START.y * map.size + TUTORIAL_START.x]).toBe(0);
});

test("every stage of Tutorial Island is reachable once its doors open", () => {
  const opened = generateWorld();
  for (const object of opened.objects) {
    if (object?.defId === "tut_door") object.defId = "gate";
  }
  const seen = new Uint8Array(opened.size * opened.size);
  const queue = [TUTORIAL_START];
  seen[TUTORIAL_START.y * opened.size + TUTORIAL_START.x] = 1;
  while (queue.length) {
    const tile = queue.pop()!;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const x = tile.x + dx;
      const y = tile.y + dy;
      if (!inBounds(opened, x, y) || seen[y * opened.size + x]) continue;
      if (!isWalkable(opened, x, y)) continue;
      seen[y * opened.size + x] = 1;
      queue.push({ x, y });
    }
  }

  for (const object of opened.objects) {
    if (!object || !onTutorialIsland(object)) continue;
    if (!["furnace", "anvil", "range", "bank_chest"].includes(object.defId)) {
      continue;
    }
    const label = `${object.defId} at ${object.x},${object.y}`;
    const near = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ].some(([dx, dy]) => seen[(object.y + dy) * opened.size + object.x + dx]);
    expect(`${label}: ${near ? "served" : "cut off"}`).toBe(`${label}: served`);
  }
});

test("the world holds the resources each skill needs", () => {
  const counts = new Map<string, number>();
  for (const object of map.objects) {
    if (object) counts.set(object.defId, (counts.get(object.defId) ?? 0) + 1);
  }
  expect(counts.get("tree")).toBeGreaterThan(50);
  expect(counts.get("oak")).toBeGreaterThan(5);
  expect(counts.get("willow")).toBeGreaterThan(5);
  expect(counts.get("rock_copper")).toBeGreaterThan(2);
  expect(counts.get("rock_coal")).toBeGreaterThan(2);
  expect(counts.get("rock_mithril")).toBeGreaterThan(0);
  expect(counts.get("furnace")).toBeGreaterThanOrEqual(2);
  expect(counts.get("anvil")).toBeGreaterThanOrEqual(2);
});

test("fishing spots sit on water so they are fished from the shore", () => {
  for (const object of map.objects) {
    if (object?.defId.startsWith("fish_")) {
      expect(terrainAt(map, object.x, object.y)).toBe(TERRAIN.water);
      expect(
        adjacentTile(map, { x: object.x, y: object.y }, object),
      ).not.toBeNull();
    }
  }
});

test("paths step one tile at a time and end at the goal", () => {
  const goal = { x: RESPAWN_TILE.x - 6, y: RESPAWN_TILE.y + 4 };
  const path = findPath(map, RESPAWN_TILE, goal);
  expect(path.at(-1)).toEqual(goal);
  let previous = RESPAWN_TILE as { x: number; y: number };
  for (const step of path) {
    expect(chebyshev(previous, step)).toBe(1);
    expect(isWalkable(map, step.x, step.y)).toBe(true);
    previous = step;
  }
});

test("an unreachable goal walks as close as it can instead", () => {
  const wall = { x: PLACES.varrock.x - 17, y: PLACES.varrock.y - 13 };
  expect(objectAt(map, wall.x, wall.y)?.defId).toBe("wall_stone");
  const path = findPath(map, RESPAWN_TILE, wall);
  expect(path.length).toBeGreaterThan(0);
  expect(path.at(-1)).not.toEqual(wall);
  expect(isWalkable(map, path.at(-1)!.x, path.at(-1)!.y)).toBe(true);
});
