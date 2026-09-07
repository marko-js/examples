import { adjacentTile, chebyshev, findPath } from "./pathfinding";
import {
  inBounds,
  isWalkable,
  objectAt,
  regionAt,
  TERRAIN,
  terrainAt,
} from "./world";
import { generateWorld } from "./worldgen";

const map = generateWorld();

test("generation is deterministic for a seed", () => {
  const again = generateWorld();
  expect(Array.from(again.terrain)).toEqual(Array.from(map.terrain));
});

test("the island is ringed by water", () => {
  for (let i = 0; i < map.size; i++) {
    expect(terrainAt(map, i, 0)).toBe(TERRAIN.water);
    expect(terrainAt(map, i, map.size - 1)).toBe(TERRAIN.water);
    expect(terrainAt(map, 0, i)).toBe(TERRAIN.water);
    expect(terrainAt(map, map.size - 1, i)).toBe(TERRAIN.water);
  }
});

test("every landmark is reachable on foot from the spawn point", () => {
  const seen = new Uint8Array(map.size * map.size);
  const queue = [{ x: 72, y: 80 }];
  seen[80 * map.size + 72] = 1;
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
      if (
        !inBounds(map, x, y) ||
        seen[y * map.size + x] ||
        !isWalkable(map, x, y)
      )
        continue;
      seen[y * map.size + x] = 1;
      queue.push({ x, y });
    }
  }

  const landmarks = {
    "castle courtyard": [60, 73],
    "castle keep": [60, 66],
    bank: [80, 66],
    "general store": [80, 83],
    mine: [23, 70],
    "chicken farm": [42, 61],
    "cow field": [53, 46],
    "east bank of the river": [95, 77],
    "goblin camp": [107, 82],
    graveyard: [104, 42],
    "maple grove": [28, 96],
    "lake shore": [64, 95],
    "north forest": [72, 24],
  };
  for (const [name, [x, y]] of Object.entries(landmarks)) {
    expect(
      `${name}: ${seen[y * map.size + x] ? "reachable" : "unreachable"}`,
    ).toBe(`${name}: reachable`);
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
  expect(counts.get("maple")).toBeGreaterThan(5);
  expect(counts.get("rock_copper")).toBeGreaterThan(1);
  expect(counts.get("rock_coal")).toBeGreaterThan(1);
  expect(counts.get("rock_mithril")).toBeGreaterThan(0);
  expect(counts.get("fish_net")).toBeGreaterThan(0);
  expect(counts.get("bank_chest")).toBe(2);
  expect(counts.get("shop_counter")).toBe(3);
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

test("regions are named after the area a tile falls in", () => {
  expect(regionAt(map, 72, 80)).toBe("Lumbridge");
  expect(regionAt(map, 23, 70)).toBe("Dwarven Mine");
  expect(regionAt(map, 107, 82)).toBe("Goblin Swamp");
});

test("paths step one tile at a time and end at the goal", () => {
  const path = findPath(map, { x: 72, y: 80 }, { x: 66, y: 86 });
  expect(path.at(-1)).toEqual({ x: 66, y: 86 });
  let previous = { x: 72, y: 80 };
  for (const step of path) {
    expect(chebyshev(previous, step)).toBe(1);
    expect(isWalkable(map, step.x, step.y)).toBe(true);
    previous = step;
  }
});

test("an unreachable goal walks as close as it can instead", () => {
  const wall = { x: 60, y: 60 };
  expect(objectAt(map, wall.x, wall.y)?.defId).toBe("wall_stone");
  const path = findPath(map, { x: 72, y: 80 }, wall);
  expect(path.length).toBeGreaterThan(0);
  expect(path.at(-1)).not.toEqual(wall);
  expect(isWalkable(map, path.at(-1)!.x, path.at(-1)!.y)).toBe(true);
});
