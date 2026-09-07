/**
 * Builds the island the game is played on. Generation is seeded, so the map is
 * identical on the server render and in the browser.
 */
import { MAINLAND_SIZE, WORLD_SIZE } from "./config";
import {
  bridgeOverWater,
  building,
  field,
  fillRect,
  isEdgeOf,
  patch,
  place,
  placeScenery,
  road,
  scatter,
  setTerrain,
  softenShore,
  terrain,
} from "./mapbuild";
import { mulberry32, randInt, type Rng } from "./rng";
import { layTutorialIsland } from "./tutorialgen";
import {
  inBounds,
  isWalkable,
  type RegionLabel,
  TERRAIN,
  type WorldMap,
} from "./world";

export function generateWorld(seed = 20250907): WorldMap {
  const size = WORLD_SIZE;
  const map: WorldMap = {
    size,
    terrain: new Uint8Array(size * size).fill(TERRAIN.water),
    objects: new Array(size * size),
    spawns: [],
    labels: [],
  };
  const rng = mulberry32(seed);

  carveCoastline(map);
  carveRiver(map);
  carveLake(map);
  layZones(map);
  layRoads(map);
  layBuildings(map);
  layScenery(map, rng);
  layFishingSpots(map);
  map.labels = [...REGIONS];
  map.spawns = [...SPAWNS];
  layTutorialIsland(map);

  return map;
}

/* --------------------------------------------------------------- landmass */

/** Carves the mainland out of the open sea, inside its own square. */
function carveCoastline(map: WorldMap): void {
  const size = MAINLAND_SIZE;
  const margin = (a: number) =>
    6 + Math.sin(a * 0.19) * 2.5 + Math.sin(a * 0.07) * 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const depth = Math.min(
        x - margin(y),
        y - margin(x),
        size - 1 - x - margin(y),
        size - 1 - y - margin(x),
      );
      if (depth < 0) continue;
      setTerrain(map, x, y, depth < 2.2 ? TERRAIN.sand : TERRAIN.grass);
    }
  }
}

function carveRiver(map: WorldMap): void {
  for (let y = 0; y < map.size; y++) {
    const centre = 89 + Math.sin(y * 0.11) * 3 + Math.sin(y * 0.043) * 2;
    const halfWidth = 2.6 + Math.sin(y * 0.08) * 0.7;
    for (
      let x = Math.floor(centre - halfWidth) - 2;
      x <= Math.ceil(centre + halfWidth) + 2;
      x++
    ) {
      const distance = Math.abs(x - centre);
      if (distance <= halfWidth) setTerrain(map, x, y, TERRAIN.water);
      else if (distance <= halfWidth + 1.2) softenShore(map, x, y);
    }
  }
}

function carveLake(map: WorldMap): void {
  for (let y = 90; y < map.size; y++) {
    for (let x = 30; x < 104; x++) {
      const rx = (x - 64) / 30;
      const ry = (y - 113) / 18;
      const wobble = Math.sin(x * 0.3) * 0.05 + Math.sin(y * 0.4) * 0.05;
      const distance = Math.sqrt(rx * rx + ry * ry) + wobble;
      if (distance < 1) setTerrain(map, x, y, TERRAIN.water);
      else if (distance < 1.12) softenShore(map, x, y);
    }
  }
}

/* ------------------------------------------------------------------ zones */

function layZones(map: WorldMap): void {
  fillRect(map, 34, 16, 50, 37, TERRAIN.darkGrass); // Lumbridge forest
  fillRect(map, 12, 56, 22, 29, TERRAIN.gravel); // Dwarven mine
  fillRect(map, 94, 58, 27, 37, TERRAIN.swamp); // Goblin swamp
  fillRect(map, 98, 35, 18, 19, TERRAIN.dirt); // Old graveyard
  fillRect(map, 18, 86, 22, 22, TERRAIN.darkGrass); // Maple grove
  fillRect(map, 50, 54, 36, 40, TERRAIN.grass); // Lumbridge itself
  fillRect(map, 102, 78, 10, 9, TERRAIN.dirt); // Goblin camp clearing
}

function layRoads(map: WorldMap): void {
  road(map, [
    [72, 94],
    [72, 22],
  ]); // main north road, out through the forest
  road(map, [
    [40, 77],
    [100, 77],
  ]); // main east road, over the Lum bridge
  road(map, [
    [34, 72],
    [44, 76],
    [52, 77],
  ]); // mine track
  road(map, [
    [69, 68],
    [73, 68],
  ]); // castle gate spur
  road(map, [
    [74, 78],
    [80, 80],
  ]); // general store spur
  road(map, [
    [72, 92],
    [52, 90],
    [30, 98],
  ]); // south road to the maple grove
  road(map, [
    [100, 77],
    [107, 79],
  ]); // swamp track
  patch(map, 74, 66, 2, 2, TERRAIN.path); // bank doorstep

  bridgeOverWater(map, 80, 76, 22, 2);
}

function layBuildings(map: WorldMap): void {
  // Lumbridge castle: a curtain wall with a keep inside.
  building(map, 52, 60, 17, 16, {
    wall: "wall_stone",
    floor: TERRAIN.stoneFloor,
    doors: [
      [68, 67],
      [68, 68],
    ],
  });
  building(map, 56, 63, 9, 8, {
    wall: "wall_stone",
    floor: TERRAIN.stoneFloor,
    doors: [[60, 70]],
  });
  place(map, 58, 65, "table");
  place(map, 62, 65, "table");
  place(map, 60, 64, "altar");

  building(map, 76, 62, 9, 9, {
    wall: "wall_wood",
    floor: TERRAIN.woodFloor,
    doors: [
      [76, 66],
      [76, 67],
    ],
  });
  place(map, 79, 64, "bank_chest");
  place(map, 82, 64, "bank_chest");

  building(map, 76, 80, 9, 9, {
    wall: "wall_wood",
    floor: TERRAIN.woodFloor,
    doors: [[80, 80]],
  });
  place(map, 78, 84, "shop_counter");
  place(map, 80, 84, "shop_counter");
  place(map, 82, 84, "shop_counter");

  building(map, 100, 38, 8, 7, {
    wall: "wall_stone",
    floor: TERRAIN.stoneFloor,
    doors: [[104, 44]],
  });
  place(map, 104, 40, "altar");
}

function layScenery(map: WorldMap, rng: Rng): void {
  scatterOre(map, rng);

  scatter(
    map,
    rng,
    { x: 34, y: 16, w: 50, h: 37 },
    ["tree", "tree", "tree", "oak"],
    210,
  );
  scatter(map, rng, { x: 76, y: 24, w: 9, h: 28 }, ["willow"], 20);
  scatter(map, rng, { x: 34, y: 16, w: 50, h: 37 }, ["bush", "flowers"], 44);
  scatter(
    map,
    rng,
    { x: 18, y: 86, w: 22, h: 22 },
    ["maple", "maple", "willow"],
    36,
  );
  scatter(map, rng, { x: 94, y: 58, w: 27, h: 37 }, ["dead_tree", "bush"], 60);
  scatter(map, rng, { x: 98, y: 35, w: 18, h: 19 }, ["dead_tree"], 18);
  scatter(map, rng, { x: 50, y: 54, w: 36, h: 40 }, ["bush", "flowers"], 22);

  field(map, 36, 56, 13, 12, [[42, 67]], TERRAIN.dirt); // chicken farm
  field(map, 46, 40, 15, 13, [[60, 46]], TERRAIN.darkGrass); // cow field

  place(map, 74, 73, "well");
  place(map, 70, 79, "sign_town");
  for (const [x, y] of [
    [103, 79],
    [110, 79],
    [103, 85],
    [110, 85],
  ] as const) {
    place(map, x, y, "dead_tree");
  }
}

function scatterOre(map: WorldMap, rng: Rng): void {
  const ores = [
    "copper",
    "copper",
    "tin",
    "tin",
    "iron",
    "iron",
    "coal",
    "coal",
    "gold",
    "mithril",
  ];
  // Two rings of rocks so several players' worth of ore sits in the pit.
  for (const [ring, radius] of [
    [0, 5],
    [1, 11],
  ] as const) {
    for (const [i, ore] of ores.entries()) {
      const angle = ((i + ring * 0.5) / ores.length) * Math.PI * 2;
      const x = Math.round(23 + Math.cos(angle) * (radius + (i % 3)));
      const y = Math.round(70 + Math.sin(angle) * (radius + (i % 4)));
      placeScenery(map, x, y, `rock_${ore}`);
    }
  }
  for (let i = 0; i < 40; i++) {
    const x = randInt(rng, 12, 33);
    const y = randInt(rng, 56, 84);
    if (isEdgeOf(map, x, y, TERRAIN.gravel))
      placeScenery(map, x, y, "rock_empty");
  }
  scatter(map, rng, { x: 13, y: 57, w: 20, h: 27 }, ["rock_empty"], 26);
}

function layFishingSpots(map: WorldMap): void {
  for (const x of [46, 52, 58, 64, 70, 76]) {
    placeAtShore(map, x, 92, 0, 1, x < 58 ? "fish_net" : "fish_bait");
  }
  for (const x of [40, 84]) placeAtShore(map, x, 92, 0, 1, "fish_cage");
  for (const y of [30, 44, 58, 88]) {
    placeAtShore(map, 82, y, 1, 0, y > 70 ? "fish_salmon" : "fish_lure");
  }
}

/** Walk until the first water tile with dry land directly beside it. */
function placeAtShore(
  map: WorldMap,
  x: number,
  y: number,
  dx: number,
  dy: number,
  defId: string,
): void {
  for (let step = 0; step < map.size; step++) {
    const tx = x + dx * step;
    const ty = y + dy * step;
    if (!inBounds(map, tx, ty)) return;
    if (
      terrain(map, tx, ty) === TERRAIN.water &&
      hasWalkableNeighbour(map, tx, ty)
    ) {
      placeScenery(map, tx, ty, defId);
      return;
    }
  }
}

function hasWalkableNeighbour(map: WorldMap, x: number, y: number): boolean {
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const) {
    if (isWalkable(map, x + dx, y + dy)) return true;
  }
  return false;
}

/* ------------------------------------------------------------- population */

const REGIONS: RegionLabel[] = [
  { x: 50, y: 54, w: 36, h: 40, text: "Lumbridge" },
  { x: 34, y: 14, w: 50, h: 40, text: "Lumbridge Forest" },
  { x: 36, y: 56, w: 13, h: 12, text: "Chicken Farm" },
  { x: 46, y: 40, w: 15, h: 13, text: "Cow Field" },
  { x: 10, y: 54, w: 26, h: 33, text: "Dwarven Mine" },
  { x: 94, y: 56, w: 28, h: 40, text: "Goblin Swamp" },
  { x: 96, y: 33, w: 22, h: 23, text: "Old Graveyard" },
  { x: 16, y: 84, w: 26, h: 26, text: "Maple Grove" },
  { x: 30, y: 90, w: 70, h: 38, text: "Lake Lum" },
  { x: 84, y: 0, w: 12, h: 128, text: "River Lum" },
];

const SPAWNS = [
  { defId: "chicken", x: 42, y: 61, radius: 5, count: 6 },
  { defId: "cow", x: 53, y: 46, radius: 5, count: 6 },
  { defId: "rat", x: 66, y: 88, radius: 6, count: 4 },
  { defId: "rat", x: 24, y: 78, radius: 6, count: 3 },
  { defId: "man", x: 72, y: 86, radius: 7, count: 4 },
  { defId: "guard", x: 66, y: 68, radius: 3, count: 2 },
  { defId: "giant_rat", x: 99, y: 66, radius: 6, count: 4 },
  { defId: "goblin", x: 107, y: 82, radius: 6, count: 6 },
  { defId: "hobgoblin", x: 114, y: 90, radius: 5, count: 3 },
  { defId: "skeleton", x: 110, y: 48, radius: 6, count: 4 },
  { defId: "banker", x: 80, y: 65, radius: 0, count: 1 },
  { defId: "banker", x: 81, y: 65, radius: 0, count: 1 },
  { defId: "shopkeeper", x: 80, y: 83, radius: 0, count: 1 },
];
