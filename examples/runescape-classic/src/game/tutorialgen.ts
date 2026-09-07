/**
 * Tutorial Island, following the RuneScape 2 route: the starting house, the
 * survival pond, the kitchen, the quest house, the mine, the rat pit, the bank,
 * the chapel and the magic house. Land is painted only where an area sits, so
 * the sea keeps the player on the path and gated doors do the rest.
 */
import { building, clear, fence, place, setTerrain } from "./mapbuild";
import { TERRAIN, type TerrainId, type WorldMap } from "./world";

/** Where the island's local grid sits in the world. */
export const TUTORIAL_ORIGIN = { x: 176, y: 176 };
export const TUTORIAL_SIZE = 72;

interface Area {
  x: number;
  y: number;
  w: number;
  h: number;
  floor: TerrainId;
  /** Rooms get stone or plank walls; outdoor areas get a fence. */
  wall?: string;
}

const AREAS: Record<string, Area> = {
  start: {
    x: 4,
    y: 4,
    w: 15,
    h: 13,
    floor: TERRAIN.woodFloor,
    wall: "wall_wood",
  },
  survival: { x: 18, y: 4, w: 29, h: 17, floor: TERRAIN.grass },
  kitchen: {
    x: 46,
    y: 4,
    w: 17,
    h: 15,
    floor: TERRAIN.stoneFloor,
    wall: "wall_stone",
  },
  quest: {
    x: 46,
    y: 18,
    w: 17,
    h: 15,
    floor: TERRAIN.woodFloor,
    wall: "wall_wood",
  },
  mine: { x: 26, y: 20, w: 21, h: 15, floor: TERRAIN.gravel },
  ratpit: { x: 26, y: 34, w: 21, h: 15, floor: TERRAIN.dirt },
  bank: {
    x: 24,
    y: 48,
    w: 23,
    h: 13,
    floor: TERRAIN.woodFloor,
    wall: "wall_wood",
  },
  chapel: {
    x: 8,
    y: 48,
    w: 17,
    h: 15,
    floor: TERRAIN.stoneFloor,
    wall: "wall_stone",
  },
  magic: {
    x: 6,
    y: 32,
    w: 17,
    h: 17,
    floor: TERRAIN.stoneFloor,
    wall: "wall_stone",
  },
};

/**
 * Doors keyed by the stage that opens them: door `stage` unlocks once that
 * stage is finished, which keeps a new player on the guided route.
 */
const DOORS: { x: number; y: number; stage: number }[] = [
  { x: 18, y: 10, stage: 0 }, // starting house -> survival area
  { x: 46, y: 12, stage: 2 }, // survival area -> kitchen
  { x: 54, y: 18, stage: 3 }, // kitchen -> quest house
  { x: 46, y: 25, stage: 4 }, // quest house -> mine
  { x: 36, y: 34, stage: 5 }, // mine -> rat pit
  { x: 36, y: 48, stage: 7 }, // rat pit -> bank
  { x: 24, y: 54, stage: 8 }, // bank -> chapel
  { x: 16, y: 48, stage: 9 }, // chapel -> magic house
];

export function layTutorialIsland(map: WorldMap): void {
  carveLand(map);
  layRooms(map);
  layScenery(map);
  layDoors(map);
  laySpawns(map);
  map.labels.push({
    ...world(0, 0),
    w: TUTORIAL_SIZE,
    h: TUTORIAL_SIZE,
    text: "Tutorial Island",
  });
}

/* ------------------------------------------------------------------ land */

function carveLand(map: WorldMap): void {
  for (const area of Object.values(AREAS)) {
    for (let y = -2; y < area.h + 2; y++) {
      for (let x = -2; x < area.w + 2; x++) {
        setLocal(map, area.x + x, area.y + y, TERRAIN.sand);
      }
    }
  }
  for (const area of Object.values(AREAS)) {
    fillLocal(map, area.x, area.y, area.w, area.h, area.floor);
  }
}

function layRooms(map: WorldMap): void {
  for (const area of Object.values(AREAS)) {
    if (!area.wall) continue;
    const at = world(area.x, area.y);
    building(map, at.x, at.y, area.w, area.h, {
      wall: area.wall,
      floor: area.floor,
      doors: [],
    });
  }

  // The outdoor stretches are fenced so their only ways out are the gates.
  outline(map, AREAS.survival);
  outline(map, AREAS.mine);
  outline(map, AREAS.ratpit);
}

function layScenery(map: WorldMap): void {
  // Survival area: a pond to net shrimp from, and trees to chop.
  for (let y = 8; y < 17; y++) {
    for (let x = 22; x < 32; x++) setLocal(map, x, y, TERRAIN.water);
  }
  placeLocal(map, 27, 8, "fish_net");
  placeLocal(map, 24, 16, "fish_net");
  for (const [x, y] of [
    [35, 7],
    [39, 9],
    [43, 7],
    [36, 14],
    [41, 15],
    [44, 12],
  ] as const) {
    placeLocal(map, x, y, "tree");
  }

  placeLocal(map, 52, 8, "range"); // kitchen
  placeLocal(map, 56, 12, "table");
  placeLocal(map, 50, 14, "table");

  placeLocal(map, 52, 22, "table"); // quest house
  placeLocal(map, 57, 28, "table");

  // Mine: the ores, a furnace and an anvil, all within a few steps.
  placeLocal(map, 30, 24, "rock_copper");
  placeLocal(map, 33, 23, "rock_tin");
  placeLocal(map, 36, 25, "rock_copper");
  placeLocal(map, 39, 23, "rock_tin");
  placeLocal(map, 31, 30, "rock_empty");
  placeLocal(map, 42, 29, "rock_empty");
  placeLocal(map, 43, 22, "furnace");
  placeLocal(map, 40, 31, "anvil");
  placeLocal(map, 43, 31, "anvil");

  placeLocal(map, 30, 55, "bank_chest"); // bank
  placeLocal(map, 40, 55, "bank_chest");

  placeLocal(map, 16, 52, "altar"); // chapel
  placeLocal(map, 12, 58, "table");
  placeLocal(map, 20, 58, "table");

  placeLocal(map, 14, 36, "altar"); // magic house
}

function layDoors(map: WorldMap): void {
  for (const door of DOORS) {
    const { x, y } = world(door.x, door.y);
    const index = y * map.size + x;
    map.objects[index] = { index, defId: "tut_door", x, y, stage: door.stage };
  }
}

function laySpawns(map: WorldMap): void {
  const spawn = (defId: string, x: number, y: number, radius = 0, count = 1) =>
    map.spawns.push({ defId, ...world(x, y), radius, count });

  spawn("gielinor_guide", 11, 7);
  spawn("survival_expert", 20, 12);
  spawn("master_chef", 52, 11);
  spawn("quest_guide", 54, 25);
  spawn("mining_instructor", 36, 29);
  spawn("combat_instructor", 31, 38);
  spawn("tutorial_rat", 38, 42, 5, 4);
  spawn("account_guide", 35, 51);
  spawn("banker", 33, 55);
  spawn("brother_brace", 16, 55);
  spawn("magic_instructor", 12, 42);
  spawn("tutorial_chicken", 18, 44, 3, 2);
}

/* --------------------------------------------------------------- helpers */

function world(x: number, y: number): { x: number; y: number } {
  return { x: TUTORIAL_ORIGIN.x + x, y: TUTORIAL_ORIGIN.y + y };
}

function setLocal(map: WorldMap, x: number, y: number, id: TerrainId): void {
  const at = world(x, y);
  setTerrain(map, at.x, at.y, id);
}

function fillLocal(
  map: WorldMap,
  x: number,
  y: number,
  w: number,
  h: number,
  id: TerrainId,
): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) setLocal(map, x + dx, y + dy, id);
  }
}

function placeLocal(map: WorldMap, x: number, y: number, defId: string): void {
  const at = world(x, y);
  clear(map, at.x, at.y);
  place(map, at.x, at.y, defId);
}

/** Fence an outdoor area's perimeter, leaving its gated doors clear. */
function outline(map: WorldMap, area: Area): void {
  const at = world(area.x, area.y);
  fence(map, at.x, at.y, area.w, area.h);
  for (const door of DOORS) {
    const on = world(door.x, door.y);
    if (
      on.x >= at.x &&
      on.y >= at.y &&
      on.x < at.x + area.w &&
      on.y < at.y + area.h
    ) {
      clear(map, on.x, on.y);
    }
  }
}
