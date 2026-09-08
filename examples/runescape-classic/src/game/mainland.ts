/**
 * The free-to-play RuneScape Classic mainland: Misthalin and Asgarnia, laid out
 * from the official Classic world map. Town positions are that map's positions
 * scaled to this grid, so the walk from Lumbridge to Varrock, or Falador to
 * Port Sarim, runs the way it always did.
 */
import {
  building,
  clear,
  fence,
  fillRect,
  place,
  placeScenery,
  road,
  ROOF_TILE,
  ROOF_WOOD,
  scatter,
  setTerrain,
  terrain,
} from "./mapbuild";
import type { Rng } from "./rng";
import { TERRAIN, type TerrainId, type WorldMap } from "./world";

/** The mainland occupies this square of the grid; the rest is open sea. */
export const MAINLAND = { width: 168, height: 184 };

/** Everything north of this line is the Wilderness. */
export const WILDERNESS_EDGE = 35;

export const PLACES = {
  goblinVillage: { x: 16, y: 50 },
  iceMountain: { x: 36, y: 54 },
  monastery: { x: 55, y: 52 },
  edgeville: { x: 79, y: 49 },
  varrockPalace: { x: 118, y: 56 },
  lumberMill: { x: 151, y: 41 },
  dwarvenMine: { x: 39, y: 68 },
  barbarianVillage: { x: 58, y: 78 },
  varrock: { x: 117, y: 77 },
  falador: { x: 28, y: 98 },
  championsGuild: { x: 105, y: 101 },
  draynorManor: { x: 72, y: 102 },
  miningGuild: { x: 40, y: 104 },
  craftingGuild: { x: 10, y: 127 },
  draynor: { x: 76, y: 135 },
  portSarim: { x: 52, y: 149 },
  rimmington: { x: 19, y: 151 },
  lumbridge: { x: 121, y: 152 },
  alKharid: { x: 147, y: 168 },
  wizardsTower: { x: 73, y: 171 },
} as const;

export function layMainland(map: WorldMap, rng: Rng): void {
  carveLand(map);
  carveRiverLum(map);
  layZones(map, rng);
  layRoads(map);
  layTowns(map);
  layWilds(map, rng);
  map.labels.push(...REGIONS);
  map.spawns.push(...SPAWNS);
}

/* ------------------------------------------------------------------ land */

function carveLand(map: WorldMap): void {
  const { width, height } = MAINLAND;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const west = x - (5 + Math.sin(y * 0.11) * 2.5);
      const east = width - 3 - x;
      const south = height - 6 - y - Math.sin(x * 0.09) * 3;
      const depth = Math.min(west, east, south);
      if (depth < 0) continue;
      setTerrain(map, x, y, depth < 2.5 ? TERRAIN.sand : TERRAIN.grass);
    }
  }

  // The bay that separates the Asgarnian peninsula from southern Misthalin.
  for (let y = 150; y < height; y++) {
    for (let x = 55; x < 120; x++) {
      const rx = (x - 84) / 30;
      const ry = (y - 194) / 22;
      const distance = Math.hypot(rx, ry) + Math.sin(x * 0.3) * 0.04;
      if (distance < 1) setTerrain(map, x, y, TERRAIN.water);
      else if (distance < 1.1 && terrain(map, x, y) !== TERRAIN.water) {
        setTerrain(map, x, y, TERRAIN.sand);
      }
    }
  }
}

/**
 * The River Lum: out of the Wilderness, through Barbarian Village, then south
 * east past Lumbridge and out to sea. Bridges cross it at the village and on
 * the Al Kharid road.
 */
function carveRiverLum(map: WorldMap): void {
  const course: [number, number][] = [
    [66, 14],
    [69, 78],
    [85, 105],
    [105, 130],
    [127, 150],
    [138, 178],
  ];
  for (let leg = 0; leg < course.length - 1; leg++) {
    const [x1, y1] = course[leg];
    const [x2, y2] = course[leg + 1];
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) * 3;
    for (let step = 0; step <= steps; step++) {
      const t = step / steps;
      const cx = x1 + (x2 - x1) * t;
      const cy = y1 + (y2 - y1) * t;
      const half = 2.4 + Math.sin(cy * 0.13) * 0.7;
      for (let dx = -5; dx <= 5; dx++) {
        const x = Math.round(cx + dx);
        const y = Math.round(cy);
        const distance = Math.abs(cx + dx - cx);
        if (distance <= half) setTerrain(map, x, y, TERRAIN.water);
        else if (
          distance <= half + 1.2 &&
          terrain(map, x, y) !== TERRAIN.water
        ) {
          setTerrain(map, x, y, TERRAIN.sand);
        }
      }
    }
  }
}

function layZones(map: WorldMap, rng: Rng): void {
  // The Wilderness: burnt ground north of the ditch.
  fillRect(map, 0, 0, MAINLAND.width, WILDERNESS_EDGE, TERRAIN.dirt);
  for (let x = 0; x < MAINLAND.width; x++) {
    if (terrain(map, x, WILDERNESS_EDGE) === TERRAIN.water) continue;
    place(map, x, WILDERNESS_EDGE, "fence");
  }

  fillRect(map, 128, 140, 40, 44, TERRAIN.sand); // Kharidian Desert
  fillRect(map, 104, 162, 28, 20, TERRAIN.swamp); // Lumbridge Swamp
  fillRect(map, 28, 44, 20, 20, TERRAIN.gravel); // Ice Mountain
  fillRect(map, 30, 60, 20, 16, TERRAIN.gravel); // Dwarven Mine
  fillRect(map, 32, 98, 16, 14, TERRAIN.gravel); // Mining Guild
  fillRect(map, 12, 140, 16, 12, TERRAIN.gravel); // Rimmington mine
  fillRect(map, 140, 154, 16, 12, TERRAIN.gravel); // Al Kharid mine

  fillRect(map, 88, 88, 26, 22, TERRAIN.darkGrass); // south west Varrock forest
  fillRect(map, 56, 120, 26, 18, TERRAIN.darkGrass); // Draynor forest
  fillRect(map, 104, 132, 24, 18, TERRAIN.darkGrass); // Lumbridge forest

  scatter(
    map,
    rng,
    { x: 88, y: 88, w: 26, h: 22 },
    ["tree", "tree", "oak"],
    60,
  );
  scatter(map, rng, { x: 56, y: 120, w: 26, h: 18 }, ["tree", "willow"], 50);
  scatter(
    map,
    rng,
    { x: 104, y: 132, w: 24, h: 18 },
    ["tree", "tree", "oak"],
    46,
  );
  scatter(map, rng, { x: 6, y: 140, w: 20, h: 16 }, ["oak", "tree"], 22);
  scatter(map, rng, { x: 40, y: 36, w: 50, h: 26 }, ["tree", "bush"], 40);
}

function layRoads(map: WorldMap): void {
  const p = PLACES;
  const routes: [number, number][][] = [
    [
      [p.lumbridge.x, p.lumbridge.y],
      [118, 120],
      [p.varrock.x, p.varrock.y],
    ],
    [
      [p.lumbridge.x, p.lumbridge.y],
      [100, 146],
      [p.draynor.x, p.draynor.y],
    ],
    [
      [p.draynor.x, p.draynor.y],
      [p.draynorManor.x, p.draynorManor.y],
    ],
    [
      [p.draynor.x, p.draynor.y],
      [64, 146],
      [p.portSarim.x, p.portSarim.y],
    ],
    [
      [p.portSarim.x, p.portSarim.y],
      [p.rimmington.x, p.rimmington.y],
    ],
    [
      [p.portSarim.x, p.portSarim.y],
      [44, 124],
      [p.falador.x, p.falador.y],
    ],
    [
      [p.falador.x, p.falador.y],
      [48, 86],
      [p.barbarianVillage.x, p.barbarianVillage.y],
    ],
    [
      [p.barbarianVillage.x, p.barbarianVillage.y],
      [95, 80],
      [p.varrock.x, p.varrock.y],
    ],
    [
      [p.varrock.x, p.varrock.y],
      [100, 58],
      [p.edgeville.x, p.edgeville.y],
    ],
    [
      [p.edgeville.x, p.edgeville.y],
      [80, WILDERNESS_EDGE - 1],
    ],
    [
      [p.varrock.x, p.varrock.y],
      [p.varrockPalace.x, p.varrockPalace.y],
    ],
    [
      [p.varrock.x, p.varrock.y],
      [135, 60],
      [p.lumberMill.x, p.lumberMill.y],
    ],
    [
      [p.lumbridge.x, p.lumbridge.y],
      [p.alKharid.x, p.alKharid.y],
    ],
    [
      [p.falador.x, p.falador.y],
      [p.iceMountain.x, p.iceMountain.y],
    ],
    [
      [p.falador.x, p.falador.y],
      [p.miningGuild.x, p.miningGuild.y],
    ],
    [
      [p.monastery.x, p.monastery.y],
      [p.edgeville.x, p.edgeville.y],
    ],
    [
      [p.goblinVillage.x, p.goblinVillage.y],
      [p.iceMountain.x, p.iceMountain.y],
    ],
    [
      [p.craftingGuild.x, p.craftingGuild.y],
      [p.rimmington.x, p.rimmington.y],
    ],
    [
      [p.draynor.x, p.draynor.y],
      [p.wizardsTower.x, p.wizardsTower.y],
    ],
  ];
  for (const route of routes) road(map, route);

  bridge(map, 66, 76, 8, 4); // Barbarian Village
  bridge(map, 122, 150, 12, 5); // the Al Kharid road out of Lumbridge
}

function bridge(
  map: WorldMap,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      if (terrain(map, x + dx, y + dy) === TERRAIN.water) {
        setTerrain(map, x + dx, y + dy, TERRAIN.bridge);
        clear(map, x + dx, y + dy);
      }
    }
  }
}

/* ----------------------------------------------------------------- towns */

interface Room {
  /** Offset from the town centre. */
  dx: number;
  dy: number;
  w: number;
  h: number;
  /** Door offsets within the room. */
  doors: [number, number][];
  wall?: string;
  floor?: TerrainId;
  /** Fills the room with a shop counter opening this shop. */
  shop?: string;
  /** Fills the room with bank chests. */
  bank?: boolean;
  contents?: [number, number, string][];
}

interface Doorstep {
  x: number;
  y: number;
  out: [number, number];
}

/** Doors collected while building, cleared once every town is standing. */
const doorsteps: Doorstep[] = [];

function house(map: WorldMap, at: { x: number; y: number }, room: Room): void {
  const x = at.x + room.dx;
  const y = at.y + room.dy;
  building(map, x, y, room.w, room.h, {
    wall: room.wall ?? "wall_stone",
    roof: (room.wall ?? "wall_stone") === "wall_wood" ? ROOF_WOOD : ROOF_TILE,
    floor:
      room.floor ??
      ((room.wall ?? "wall_stone") === "wall_stone"
        ? TERRAIN.stoneFloor
        : TERRAIN.woodFloor),
    doors: room.doors.map(([dx, dy]) => [x + dx, y + dy] as const),
  });
  for (const [dx, dy] of room.doors) {
    doorsteps.push({
      x: x + dx,
      y: y + dy,
      out:
        dx === 0
          ? [-1, 0]
          : dx === room.w - 1
            ? [1, 0]
            : dy === 0
              ? [0, -1]
              : [0, 1],
    });
  }
  if (room.shop) {
    for (let i = 0; i < 2; i++) {
      const cx = x + 2 + i * 2;
      const cy = y + room.h - 3;
      place(map, cx, cy, "shop_counter");
      const object = map.objects[cy * map.size + cx];
      if (object) object.shopId = room.shop;
    }
  }
  if (room.bank) {
    place(map, x + 2, y + 2, "bank_chest");
    place(map, x + room.w - 3, y + 2, "bank_chest");
  }
  for (const [dx, dy, defId] of room.contents ?? []) {
    place(map, x + dx, y + dy, defId);
  }
}

/**
 * Clear the ground outside every door. Towns pack tightly enough that a door
 * can open straight into a neighbour's wall, so this runs once they all stand.
 */
function layDoorsteps(map: WorldMap): void {
  for (const step of doorsteps) {
    for (let out = 1; out <= 2; out++) {
      const x = step.x + step.out[0] * out;
      const y = step.y + step.out[1] * out;
      clear(map, x, y);
      if (terrain(map, x, y) !== TERRAIN.water)
        setTerrain(map, x, y, TERRAIN.path);
    }
  }
  doorsteps.length = 0;
}

function layTowns(map: WorldMap): void {
  const p = PLACES;
  doorsteps.length = 0;

  // Lumbridge: the castle, general store, Bob's axes and the chapel, all on
  // the west bank of the Lum with the fields north of town.
  house(map, p.lumbridge, {
    dx: -14,
    dy: -10,
    w: 16,
    h: 16,
    doors: [[0, 8]],
    contents: [
      [8, 3, "altar"],
      [4, 11, "table"],
      [11, 11, "table"],
    ],
  });
  house(map, p.lumbridge, {
    dx: -25,
    dy: -10,
    w: 9,
    h: 8,
    doors: [[8, 4]],
    shop: "general",
    wall: "wall_wood",
  });
  house(map, p.lumbridge, {
    dx: -25,
    dy: 0,
    w: 9,
    h: 8,
    doors: [[8, 4]],
    shop: "axes",
    wall: "wall_wood",
  });
  house(map, p.lumbridge, {
    dx: -14,
    dy: 9,
    w: 10,
    h: 8,
    doors: [[5, 0]],
    contents: [[4, 4, "altar"]],
  });
  placeScenery(map, p.lumbridge.x - 16, p.lumbridge.y + 2, "furnace");
  fence(map, p.lumbridge.x - 35, p.lumbridge.y - 28, 16, 12);
  fence(map, p.lumbridge.x - 39, p.lumbridge.y - 14, 14, 10);

  // Varrock: walled city, palace to the north, two banks, the shop row.
  cityWall(map, p.varrock, 34, 26);
  house(map, p.varrockPalace, {
    dx: -10,
    dy: -6,
    w: 21,
    h: 15,
    doors: [[10, 14]],
    contents: [
      [10, 3, "altar"],
      [6, 8, "table"],
      [14, 8, "table"],
    ],
  });
  house(map, p.varrock, {
    dx: -14,
    dy: -6,
    w: 10,
    h: 8,
    doors: [[9, 4]],
    bank: true,
    wall: "wall_wood",
  });
  house(map, p.varrock, {
    dx: 6,
    dy: -6,
    w: 10,
    h: 8,
    doors: [[0, 4]],
    bank: true,
    wall: "wall_wood",
  });
  house(map, p.varrock, {
    dx: -14,
    dy: 4,
    w: 9,
    h: 8,
    doors: [[4, 0]],
    shop: "swords",
    wall: "wall_wood",
  });
  house(map, p.varrock, {
    dx: -3,
    dy: 4,
    w: 9,
    h: 8,
    doors: [[4, 0]],
    shop: "armour",
    wall: "wall_wood",
  });
  house(map, p.varrock, {
    dx: 8,
    dy: 4,
    w: 9,
    h: 8,
    doors: [[4, 0]],
    shop: "archery",
    wall: "wall_wood",
  });
  house(map, p.varrock, {
    dx: 8,
    dy: -16,
    w: 9,
    h: 8,
    doors: [[4, 7]],
    shop: "runes",
    wall: "wall_wood",
  });
  house(map, p.varrock, {
    dx: -14,
    dy: -16,
    w: 9,
    h: 8,
    doors: [[4, 7]],
    shop: "general",
    wall: "wall_wood",
  });
  for (const [dx, dy] of [
    [-2, -1],
    [2, -1],
    [0, 2],
  ] as const) {
    placeScenery(map, p.varrock.x + dx, p.varrock.y + dy, "flowers");
  }

  // Falador: White Knights' castle, park, two banks, the shop row.
  cityWall(map, p.falador, 32, 24);
  house(map, p.falador, {
    dx: -14,
    dy: -8,
    w: 14,
    h: 14,
    doors: [[13, 7]],
    contents: [
      [6, 3, "altar"],
      [3, 9, "table"],
      [9, 9, "table"],
    ],
  });
  house(map, p.falador, {
    dx: 3,
    dy: -8,
    w: 10,
    h: 8,
    doors: [[0, 4]],
    bank: true,
    wall: "wall_wood",
  });
  house(map, p.falador, {
    dx: 3,
    dy: 3,
    w: 10,
    h: 8,
    doors: [[0, 4]],
    bank: true,
    wall: "wall_wood",
  });
  house(map, p.falador, {
    dx: -6,
    dy: 6,
    w: 9,
    h: 7,
    doors: [[4, 0]],
    shop: "shields",
    wall: "wall_wood",
  });
  house(map, p.falador, {
    dx: -6,
    dy: -14,
    w: 9,
    h: 7,
    doors: [[4, 6]],
    shop: "general",
    wall: "wall_wood",
  });
  placeScenery(map, p.falador.x + 1, p.falador.y - 2, "furnace");

  // Draynor Village: bank, market, Aggie, Ned, Morgan, the jail to the east.
  house(map, p.draynor, {
    dx: -3,
    dy: -6,
    w: 9,
    h: 8,
    doors: [[4, 7]],
    bank: true,
    wall: "wall_wood",
  });
  house(map, p.draynor, {
    dx: -12,
    dy: 2,
    w: 8,
    h: 7,
    doors: [[7, 3]],
    wall: "wall_wood",
    contents: [[3, 3, "table"]],
  });
  house(map, p.draynor, {
    dx: 6,
    dy: 2,
    w: 8,
    h: 7,
    doors: [[0, 3]],
    wall: "wall_wood",
    contents: [[4, 3, "table"]],
  });
  house(map, p.draynor, {
    dx: -3,
    dy: 6,
    w: 8,
    h: 7,
    doors: [[4, 0]],
    shop: "general",
    wall: "wall_wood",
  });
  house(map, p.draynor, {
    dx: 14,
    dy: -2,
    w: 9,
    h: 9,
    doors: [[0, 4]],
    contents: [[4, 4, "table"]],
  });
  house(map, p.draynorManor, {
    dx: -8,
    dy: -6,
    w: 17,
    h: 13,
    doors: [[8, 12]],
    contents: [
      [8, 3, "altar"],
      [4, 8, "table"],
      [12, 8, "table"],
    ],
  });

  // Port Sarim: the docks, jail, and the shops along the front.
  for (let x = -4; x < 10; x++) {
    for (let y = 6; y < 10; y++) {
      setTerrain(map, p.portSarim.x + x, p.portSarim.y + y, TERRAIN.bridge);
    }
  }
  house(map, p.portSarim, {
    dx: -12,
    dy: -6,
    w: 9,
    h: 8,
    doors: [[8, 4]],
    shop: "fishing",
    wall: "wall_wood",
  });
  house(map, p.portSarim, {
    dx: -1,
    dy: -6,
    w: 9,
    h: 8,
    doors: [[4, 7]],
    shop: "general",
    wall: "wall_wood",
  });
  house(map, p.portSarim, {
    dx: 10,
    dy: -6,
    w: 9,
    h: 8,
    doors: [[0, 4]],
    shop: "runes",
    wall: "wall_wood",
  });
  house(map, p.portSarim, {
    dx: -12,
    dy: 4,
    w: 9,
    h: 7,
    doors: [[4, 0]],
    contents: [[4, 3, "altar"]],
  });
  house(map, p.portSarim, {
    dx: 12,
    dy: 2,
    w: 9,
    h: 8,
    doors: [[4, 0]],
    wall: "wall_stone",
    contents: [[4, 4, "table"]],
  });

  // Rimmington: a general store, a crafting shop and the mine to the north.
  house(map, p.rimmington, {
    dx: -6,
    dy: -4,
    w: 9,
    h: 8,
    doors: [[4, 7]],
    shop: "general",
    wall: "wall_wood",
  });
  house(map, p.rimmington, {
    dx: 4,
    dy: -4,
    w: 8,
    h: 8,
    doors: [[4, 7]],
    wall: "wall_wood",
    contents: [[4, 3, "range"]],
  });
  house(map, p.rimmington, {
    dx: -2,
    dy: 6,
    w: 8,
    h: 7,
    doors: [[4, 0]],
    wall: "wall_wood",
    contents: [[3, 3, "table"]],
  });

  // Barbarian Village: the longhall, Peksa's helmets, the mine, the bridge.
  house(map, p.barbarianVillage, {
    dx: 2,
    dy: -5,
    w: 15,
    h: 10,
    doors: [[7, 9]],
    wall: "wall_wood",
    contents: [
      [4, 3, "table"],
      [10, 3, "table"],
      [4, 6, "fire"],
      [10, 6, "fire"],
    ],
  });
  house(map, p.barbarianVillage, {
    dx: 3,
    dy: 8,
    w: 8,
    h: 7,
    doors: [[4, 0]],
    shop: "helmets",
    wall: "wall_wood",
  });

  // Edgeville: the bank, general store, and the road into the Wilderness.
  house(map, p.edgeville, {
    dx: -6,
    dy: -4,
    w: 10,
    h: 8,
    doors: [[4, 7]],
    bank: true,
    wall: "wall_wood",
  });
  house(map, p.edgeville, {
    dx: 6,
    dy: -4,
    w: 9,
    h: 8,
    doors: [[0, 4]],
    shop: "general",
    wall: "wall_wood",
  });
  house(map, p.edgeville, {
    dx: -4,
    dy: 6,
    w: 9,
    h: 7,
    doors: [[4, 0]],
    wall: "wall_stone",
    contents: [[4, 3, "altar"]],
  });

  // Al Kharid: palace, bank, scimitars, the furnace and the mine.
  house(map, p.alKharid, {
    dx: -8,
    dy: 2,
    w: 17,
    h: 13,
    doors: [[8, 0]],
    wall: "wall_stone",
    contents: [
      [8, 4, "table"],
      [4, 8, "table"],
      [12, 8, "table"],
    ],
  });
  house(map, p.alKharid, {
    dx: -14,
    dy: -6,
    w: 9,
    h: 8,
    doors: [[8, 4]],
    bank: true,
    wall: "wall_stone",
  });
  house(map, p.alKharid, {
    dx: -2,
    dy: -8,
    w: 9,
    h: 8,
    doors: [[4, 7]],
    shop: "scimitars",
    wall: "wall_stone",
  });
  house(map, p.alKharid, {
    dx: 8,
    dy: -6,
    w: 9,
    h: 8,
    doors: [[0, 4]],
    shop: "general",
    wall: "wall_stone",
  });
  placeScenery(map, p.alKharid.x - 12, p.alKharid.y + 2, "furnace");

  // The monastery, the Champions' Guild and the Wizards' Tower.
  house(map, p.monastery, {
    dx: -7,
    dy: -5,
    w: 15,
    h: 11,
    doors: [[7, 10]],
    contents: [[7, 3, "altar"]],
  });
  house(map, p.championsGuild, {
    dx: -5,
    dy: -5,
    w: 11,
    h: 10,
    doors: [[5, 9]],
    contents: [[5, 3, "table"]],
  });
  house(map, p.wizardsTower, {
    dx: -5,
    dy: -5,
    w: 11,
    h: 11,
    doors: [[5, 0]],
    contents: [[5, 3, "altar"]],
  });
  house(map, p.craftingGuild, {
    dx: -5,
    dy: -5,
    w: 11,
    h: 10,
    doors: [[5, 9]],
    contents: [[5, 3, "table"]],
  });

  // Goblin Village: huts either side of the road.
  for (const [dx, dy] of [
    [-6, -4],
    [4, -4],
    [-6, 4],
    [4, 4],
  ] as const) {
    house(map, p.goblinVillage, {
      dx,
      dy,
      w: 6,
      h: 5,
      doors: [[3, 4]],
      wall: "wall_wood",
    });
  }

  layDoorsteps(map);
}

/** A ring of city wall with a gate on each side. */
function cityWall(
  map: WorldMap,
  at: { x: number; y: number },
  w: number,
  h: number,
): void {
  const x = at.x - Math.floor(w / 2);
  const y = at.y - Math.floor(h / 2);
  for (let dx = 0; dx < w; dx++) {
    place(map, x + dx, y, "wall_stone");
    place(map, x + dx, y + h - 1, "wall_stone");
  }
  for (let dy = 0; dy < h; dy++) {
    place(map, x, y + dy, "wall_stone");
    place(map, x + w - 1, y + dy, "wall_stone");
  }
  for (const [gx, gy] of [
    [x + Math.floor(w / 2), y],
    [x + Math.floor(w / 2), y + h - 1],
    [x, y + Math.floor(h / 2)],
    [x + w - 1, y + Math.floor(h / 2)],
  ]) {
    place(map, gx, gy, "gate");
    place(map, gx + 1, gy, "gate");
  }
}

/* ------------------------------------------------------- mines and wilds */

function layWilds(map: WorldMap, rng: Rng): void {
  mine(map, 32, 62, 16, 12, ["copper", "tin", "iron", "coal", "coal", "gold"]);
  mine(map, 34, 100, 12, 10, ["coal", "coal", "iron", "mithril"]);
  mine(map, 13, 141, 14, 10, ["copper", "tin", "iron", "gold"]);
  mine(map, 141, 155, 14, 10, ["copper", "tin", "iron", "coal"]);
  mine(map, 48, 84, 10, 8, ["tin", "tin", "coal", "coal"]); // Barbarian Village

  scatter(
    map,
    rng,
    { x: 0, y: 2, w: MAINLAND.width, h: WILDERNESS_EDGE - 4 },
    ["dead_tree", "rock_empty", "bush"],
    150,
  );
  scatter(map, rng, { x: 128, y: 142, w: 38, h: 40 }, ["dead_tree"], 24);

  // Fishing spots along the coasts and the Lum.
  for (const [x, y] of [
    [50, 158],
    [46, 160],
    [96, 162],
    [8, 148],
    [120, 176],
  ] as const) {
    shoreSpot(map, x, y, "fish_net");
  }
  for (const [x, y] of [
    [70, 86],
    [72, 68],
    [110, 136],
    [130, 162],
  ] as const) {
    shoreSpot(map, x, y, "fish_lure");
  }
}

function mine(
  map: WorldMap,
  x: number,
  y: number,
  w: number,
  h: number,
  ores: string[],
): void {
  for (const [i, ore] of ores.entries()) {
    const angle = (i / ores.length) * Math.PI * 2;
    const ox = Math.round(x + w / 2 + Math.cos(angle) * (w / 2 - 2));
    const oy = Math.round(y + h / 2 + Math.sin(angle) * (h / 2 - 2));
    placeNear(map, ox, oy, `rock_${ore}`);
  }
}

/** Place scenery at the first free tile at or near a point. */
function placeNear(map: WorldMap, x: number, y: number, defId: string): void {
  for (let radius = 0; radius < 6; radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (placeScenery(map, x + dx, y + dy, defId)) return;
      }
    }
  }
}

/** Put a fishing spot on the nearest water tile that has dry land beside it. */
function shoreSpot(map: WorldMap, x: number, y: number, defId: string): void {
  for (let radius = 0; radius < 12; radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const tx = x + dx;
        const ty = y + dy;
        if (terrain(map, tx, ty) !== TERRAIN.water) continue;
        const beside = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].some(([ax, ay]) => {
          const id = terrain(map, tx + ax, ty + ay);
          return id !== TERRAIN.water && id !== TERRAIN.bridge;
        });
        if (beside && placeScenery(map, tx, ty, defId)) return;
      }
    }
  }
}

/* ------------------------------------------------------------- populations */

const REGIONS = [
  { x: 0, y: 0, w: MAINLAND.width, h: WILDERNESS_EDGE, text: "The Wilderness" },
  { x: 100, y: 60, w: 40, h: 36, text: "Varrock" },
  { x: 100, y: 40, w: 40, h: 20, text: "Varrock Palace" },
  { x: 64, y: 38, w: 30, h: 22, text: "Edgeville" },
  { x: 42, y: 40, w: 22, h: 22, text: "Monastery" },
  { x: 4, y: 38, w: 26, h: 24, text: "Goblin Village" },
  { x: 26, y: 42, w: 22, h: 20, text: "Ice Mountain" },
  { x: 28, y: 60, w: 24, h: 18, text: "Dwarven Mine" },
  { x: 54, y: 66, w: 28, h: 26, text: "Barbarian Village" },
  { x: 10, y: 84, w: 38, h: 30, text: "Falador" },
  { x: 92, y: 90, w: 26, h: 22, text: "Champions' Guild" },
  { x: 60, y: 92, w: 26, h: 20, text: "Draynor Manor" },
  { x: 0, y: 116, w: 24, h: 22, text: "Crafting Guild" },
  { x: 62, y: 124, w: 34, h: 24, text: "Draynor Village" },
  { x: 38, y: 138, w: 32, h: 26, text: "Port Sarim" },
  { x: 4, y: 138, w: 30, h: 26, text: "Rimmington" },
  { x: 104, y: 140, w: 34, h: 28, text: "Lumbridge" },
  { x: 60, y: 160, w: 28, h: 24, text: "Wizards' Tower" },
  { x: 132, y: 152, w: 36, h: 32, text: "Al Kharid" },
  { x: 104, y: 162, w: 28, h: 20, text: "Lumbridge Swamp" },
  { x: 138, y: 30, w: 30, h: 24, text: "Lumber Mill" },
];

const SPAWNS = [
  {
    defId: "man",
    x: PLACES.lumbridge.x,
    y: PLACES.lumbridge.y + 2,
    radius: 8,
    count: 4,
  },
  {
    defId: "cow",
    x: PLACES.lumbridge.x - 22,
    y: PLACES.lumbridge.y - 20,
    radius: 5,
    count: 6,
  },
  {
    defId: "chicken",
    x: PLACES.lumbridge.x - 23,
    y: PLACES.lumbridge.y - 7,
    radius: 4,
    count: 6,
  },
  {
    defId: "shopkeeper",
    x: PLACES.lumbridge.x + 8,
    y: PLACES.lumbridge.y - 5,
    radius: 0,
    count: 1,
  },
  {
    defId: "shopkeeper",
    x: PLACES.lumbridge.x + 8,
    y: PLACES.lumbridge.y + 7,
    radius: 0,
    count: 1,
  },

  {
    defId: "man",
    x: PLACES.varrock.x,
    y: PLACES.varrock.y,
    radius: 10,
    count: 6,
  },
  {
    defId: "guard",
    x: PLACES.varrock.x,
    y: PLACES.varrock.y - 13,
    radius: 3,
    count: 3,
  },
  {
    defId: "banker",
    x: PLACES.varrock.x - 11,
    y: PLACES.varrock.y - 4,
    radius: 0,
    count: 2,
  },
  {
    defId: "banker",
    x: PLACES.varrock.x + 9,
    y: PLACES.varrock.y - 4,
    radius: 0,
    count: 2,
  },
  {
    defId: "shopkeeper",
    x: PLACES.varrock.x - 10,
    y: PLACES.varrock.y + 7,
    radius: 0,
    count: 1,
  },
  {
    defId: "shopkeeper",
    x: PLACES.varrock.x + 1,
    y: PLACES.varrock.y + 7,
    radius: 0,
    count: 1,
  },
  {
    defId: "shopkeeper",
    x: PLACES.varrock.x + 12,
    y: PLACES.varrock.y + 7,
    radius: 0,
    count: 1,
  },
  {
    defId: "dark_wizard",
    x: PLACES.varrock.x - 12,
    y: PLACES.varrock.y + 24,
    radius: 5,
    count: 5,
  },

  {
    defId: "white_knight",
    x: PLACES.falador.x - 8,
    y: PLACES.falador.y,
    radius: 4,
    count: 4,
  },
  {
    defId: "guard",
    x: PLACES.falador.x,
    y: PLACES.falador.y - 11,
    radius: 3,
    count: 3,
  },
  {
    defId: "banker",
    x: PLACES.falador.x + 6,
    y: PLACES.falador.y - 6,
    radius: 0,
    count: 2,
  },
  {
    defId: "shopkeeper",
    x: PLACES.falador.x - 2,
    y: PLACES.falador.y + 9,
    radius: 0,
    count: 1,
  },

  {
    defId: "barbarian",
    x: PLACES.barbarianVillage.x + 8,
    y: PLACES.barbarianVillage.y,
    radius: 6,
    count: 6,
  },
  {
    defId: "shopkeeper",
    x: PLACES.barbarianVillage.x + 7,
    y: PLACES.barbarianVillage.y + 11,
    radius: 0,
    count: 1,
  },

  {
    defId: "banker",
    x: PLACES.edgeville.x - 2,
    y: PLACES.edgeville.y - 2,
    radius: 0,
    count: 2,
  },
  {
    defId: "guard",
    x: PLACES.edgeville.x,
    y: PLACES.edgeville.y - 8,
    radius: 3,
    count: 2,
  },
  {
    defId: "man",
    x: PLACES.edgeville.x,
    y: PLACES.edgeville.y + 4,
    radius: 5,
    count: 3,
  },
  {
    defId: "monk",
    x: PLACES.monastery.x,
    y: PLACES.monastery.y,
    radius: 5,
    count: 4,
  },

  {
    defId: "banker",
    x: PLACES.draynor.x,
    y: PLACES.draynor.y - 4,
    radius: 0,
    count: 2,
  },
  {
    defId: "man",
    x: PLACES.draynor.x,
    y: PLACES.draynor.y,
    radius: 8,
    count: 4,
  },
  {
    defId: "shopkeeper",
    x: PLACES.draynor.x + 1,
    y: PLACES.draynor.y + 9,
    radius: 0,
    count: 1,
  },

  {
    defId: "shopkeeper",
    x: PLACES.portSarim.x - 4,
    y: PLACES.portSarim.y - 3,
    radius: 0,
    count: 1,
  },
  {
    defId: "shopkeeper",
    x: PLACES.portSarim.x + 3,
    y: PLACES.portSarim.y - 3,
    radius: 0,
    count: 1,
  },
  {
    defId: "man",
    x: PLACES.portSarim.x,
    y: PLACES.portSarim.y + 4,
    radius: 6,
    count: 3,
  },

  {
    defId: "shopkeeper",
    x: PLACES.rimmington.x - 2,
    y: PLACES.rimmington.y - 1,
    radius: 0,
    count: 1,
  },
  {
    defId: "rat",
    x: PLACES.rimmington.x,
    y: PLACES.rimmington.y + 2,
    radius: 6,
    count: 4,
  },

  {
    defId: "banker",
    x: PLACES.alKharid.x - 10,
    y: PLACES.alKharid.y - 4,
    radius: 0,
    count: 2,
  },
  {
    defId: "shopkeeper",
    x: PLACES.alKharid.x + 2,
    y: PLACES.alKharid.y - 5,
    radius: 0,
    count: 1,
  },
  {
    defId: "guard",
    x: PLACES.alKharid.x,
    y: PLACES.alKharid.y + 1,
    radius: 4,
    count: 3,
  },

  {
    defId: "goblin",
    x: PLACES.goblinVillage.x,
    y: PLACES.goblinVillage.y,
    radius: 7,
    count: 8,
  },
  { defId: "giant_rat", x: 70, y: 20, radius: 8, count: 6 },
  { defId: "skeleton", x: 100, y: 18, radius: 8, count: 5 },
  { defId: "hobgoblin", x: 40, y: 14, radius: 8, count: 5 },
  { defId: "dark_wizard", x: 130, y: 22, radius: 8, count: 4 },
].filter((spawn) => spawn.count > 0);
