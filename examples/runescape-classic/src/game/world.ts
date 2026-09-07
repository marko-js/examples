/** Terrain, scenery, and the helpers used to read a generated map. */
import type { ToolKind } from "./items";
import type { SkillId } from "./skills";

export const TERRAIN = {
  grass: 0,
  darkGrass: 1,
  dirt: 2,
  path: 3,
  sand: 4,
  water: 5,
  woodFloor: 6,
  stoneFloor: 7,
  bridge: 8,
  swamp: 9,
  gravel: 10,
} as const;

export type TerrainId = (typeof TERRAIN)[keyof typeof TERRAIN];

export interface TerrainDef {
  name: string;
  /** Base colour, varied per tile by the renderer. */
  colour: string;
  /** Second colour mixed in as speckle. */
  speckle: string;
  walkable: boolean;
  /** Colour used on the minimap. */
  minimap: string;
}

export const TERRAIN_DEFS: Record<TerrainId, TerrainDef> = {
  [TERRAIN.grass]: {
    name: "grass",
    colour: "#3f7a35",
    speckle: "#4a8c3e",
    walkable: true,
    minimap: "#3f7a35",
  },
  [TERRAIN.darkGrass]: {
    name: "grass",
    colour: "#2f5f28",
    speckle: "#3a7031",
    walkable: true,
    minimap: "#2f5f28",
  },
  [TERRAIN.dirt]: {
    name: "dirt",
    colour: "#6b5334",
    speckle: "#7b613e",
    walkable: true,
    minimap: "#6b5334",
  },
  [TERRAIN.path]: {
    name: "path",
    colour: "#8d7a58",
    speckle: "#9c8964",
    walkable: true,
    minimap: "#8d7a58",
  },
  [TERRAIN.sand]: {
    name: "sand",
    colour: "#c2ac74",
    speckle: "#d0bb84",
    walkable: true,
    minimap: "#c2ac74",
  },
  [TERRAIN.water]: {
    name: "water",
    colour: "#26568c",
    speckle: "#2f6aa8",
    walkable: false,
    minimap: "#26568c",
  },
  [TERRAIN.woodFloor]: {
    name: "floor",
    colour: "#7a5a34",
    speckle: "#8a683e",
    walkable: true,
    minimap: "#7a5a34",
  },
  [TERRAIN.stoneFloor]: {
    name: "floor",
    colour: "#7d7d78",
    speckle: "#8b8b86",
    walkable: true,
    minimap: "#7d7d78",
  },
  [TERRAIN.bridge]: {
    name: "bridge",
    colour: "#8a6a3c",
    speckle: "#7a5c33",
    walkable: true,
    minimap: "#8a6a3c",
  },
  [TERRAIN.swamp]: {
    name: "swamp",
    colour: "#41503a",
    speckle: "#4c5c42",
    walkable: true,
    minimap: "#41503a",
  },
  [TERRAIN.gravel]: {
    name: "gravel",
    colour: "#6d6862",
    speckle: "#7c766f",
    walkable: true,
    minimap: "#6d6862",
  },
};

export type ObjectArt =
  | {
      kind: "tree";
      trunk: string;
      canopy: string;
      canopyShade: string;
      size: number;
    }
  | { kind: "stump"; trunk: string }
  | { kind: "rock"; body: string; vein: string | null }
  | { kind: "wall"; face: string; top: string }
  | { kind: "fence" }
  | { kind: "gate" }
  | { kind: "fire" }
  | { kind: "chest"; colour: string }
  | { kind: "counter"; colour: string }
  | { kind: "ripple" }
  | { kind: "bush"; colour: string }
  | { kind: "flowers"; colour: string }
  | { kind: "sign"; text: string }
  | { kind: "well" }
  | { kind: "altar" }
  | { kind: "table" }
  | { kind: "range" }
  | { kind: "furnace" }
  | { kind: "anvil" }
  | { kind: "door"; colour: string }
  | { kind: "boat" };

export interface GatherDef {
  skill: SkillId;
  level: number;
  xp: number;
  /** Item added to the inventory on a successful attempt. */
  item: string;
  tool: ToolKind;
  /** Verb shown in the menu, such as "Chop" or "Mine". */
  action: string;
  /** Higher is slower to gather. */
  difficulty: number;
  /** Object this becomes once gathered, when it depletes at all. */
  depletesTo?: string;
  respawnTicks?: number;
}

export interface ObjectDef {
  id: string;
  name: string;
  examine: string;
  blocking: boolean;
  art: ObjectArt;
  gather?: GatherDef;
  /** Extra menu actions handled by the engine, such as "Bank" or "Trade". */
  use?: "bank" | "shop" | "cook" | "smelt" | "smith" | "boat";
  /** Drawn one tile tall rather than overlapping the tile above. */
  flat?: boolean;
}

function tree(
  id: string,
  name: string,
  gather: GatherDef | undefined,
  art: Extract<ObjectArt, { kind: "tree" }>,
): ObjectDef {
  return {
    id,
    name,
    examine: `A ${name.toLowerCase()}.`,
    blocking: true,
    art,
    gather,
  };
}

const OBJECT_LIST: ObjectDef[] = [
  tree(
    "tree",
    "Tree",
    {
      skill: "woodcutting",
      level: 1,
      xp: 25,
      item: "logs",
      tool: "axe",
      action: "Chop",
      difficulty: 1,
      depletesTo: "stump",
      respawnTicks: 20,
    },
    {
      kind: "tree",
      trunk: "#5b3c22",
      canopy: "#2f6a2a",
      canopyShade: "#255422",
      size: 1,
    },
  ),
  tree(
    "oak",
    "Oak tree",
    {
      skill: "woodcutting",
      level: 15,
      xp: 37,
      item: "oak_logs",
      tool: "axe",
      action: "Chop",
      difficulty: 2,
      depletesTo: "stump",
      respawnTicks: 30,
    },
    {
      kind: "tree",
      trunk: "#4c3520",
      canopy: "#3d7a30",
      canopyShade: "#2f6026",
      size: 1.15,
    },
  ),
  tree(
    "willow",
    "Willow tree",
    {
      skill: "woodcutting",
      level: 30,
      xp: 63,
      item: "willow_logs",
      tool: "axe",
      action: "Chop",
      difficulty: 3,
      depletesTo: "stump",
      respawnTicks: 40,
    },
    {
      kind: "tree",
      trunk: "#57482a",
      canopy: "#7d9440",
      canopyShade: "#647a33",
      size: 1.2,
    },
  ),
  tree(
    "maple",
    "Maple tree",
    {
      skill: "woodcutting",
      level: 45,
      xp: 100,
      item: "maple_logs",
      tool: "axe",
      action: "Chop",
      difficulty: 5,
      depletesTo: "stump",
      respawnTicks: 55,
    },
    {
      kind: "tree",
      trunk: "#5b3c22",
      canopy: "#b4552c",
      canopyShade: "#8f3f20",
      size: 1.1,
    },
  ),
  {
    id: "stump",
    name: "Tree stump",
    examine: "This tree has been cut down.",
    blocking: true,
    art: { kind: "stump", trunk: "#5b3c22" },
  },
  {
    id: "dead_tree",
    name: "Dead tree",
    examine: "Nothing left to chop.",
    blocking: true,
    art: {
      kind: "tree",
      trunk: "#4a3d31",
      canopy: "#4a3d31",
      canopyShade: "#3a2f26",
      size: 0.75,
    },
  },
];

const ROCKS: {
  id: string;
  name: string;
  item: string;
  level: number;
  xp: number;
  difficulty: number;
  respawn: number;
  vein: string;
}[] = [
  {
    id: "copper",
    name: "Copper rock",
    item: "copper_ore",
    level: 1,
    xp: 17,
    difficulty: 1,
    respawn: 8,
    vein: "#c1662f",
  },
  {
    id: "tin",
    name: "Tin rock",
    item: "tin_ore",
    level: 1,
    xp: 17,
    difficulty: 1,
    respawn: 8,
    vein: "#b6c0c6",
  },
  {
    id: "iron",
    name: "Iron rock",
    item: "iron_ore",
    level: 15,
    xp: 35,
    difficulty: 2,
    respawn: 14,
    vein: "#8a4b3a",
  },
  {
    id: "coal",
    name: "Coal rock",
    item: "coal",
    level: 30,
    xp: 50,
    difficulty: 4,
    respawn: 24,
    vein: "#151515",
  },
  {
    id: "gold",
    name: "Gold rock",
    item: "gold_ore",
    level: 40,
    xp: 65,
    difficulty: 6,
    respawn: 40,
    vein: "#e2b32c",
  },
  {
    id: "mithril",
    name: "Mithril rock",
    item: "mithril_ore",
    level: 55,
    xp: 80,
    difficulty: 9,
    respawn: 70,
    vein: "#4d5da6",
  },
];

for (const rock of ROCKS) {
  OBJECT_LIST.push({
    id: `rock_${rock.id}`,
    name: rock.name,
    examine: `A rocky outcrop containing ${rock.name.split(" ")[0].toLowerCase()}.`,
    blocking: true,
    art: { kind: "rock", body: "#8d857c", vein: rock.vein },
    gather: {
      skill: "mining",
      level: rock.level,
      xp: rock.xp,
      item: rock.item,
      tool: "pickaxe",
      action: "Mine",
      difficulty: rock.difficulty,
      depletesTo: "rock_empty",
      respawnTicks: rock.respawn,
    },
  });
}

const FISHING: {
  id: string;
  name: string;
  tool: ToolKind;
  action: string;
  item: string;
  level: number;
  xp: number;
  difficulty: number;
}[] = [
  {
    id: "net",
    name: "Fishing spot",
    tool: "net",
    action: "Net",
    item: "raw_shrimp",
    level: 1,
    xp: 30,
    difficulty: 1,
  },
  {
    id: "bait",
    name: "Fishing spot",
    tool: "rod",
    action: "Bait",
    item: "raw_sardine",
    level: 5,
    xp: 40,
    difficulty: 1,
  },
  {
    id: "lure",
    name: "Fishing spot",
    tool: "rod",
    action: "Lure",
    item: "raw_trout",
    level: 20,
    xp: 70,
    difficulty: 3,
  },
  {
    id: "salmon",
    name: "Fishing spot",
    tool: "rod",
    action: "Lure",
    item: "raw_salmon",
    level: 30,
    xp: 90,
    difficulty: 5,
  },
  {
    id: "cage",
    name: "Fishing spot",
    tool: "pot",
    action: "Cage",
    item: "raw_lobster",
    level: 40,
    xp: 120,
    difficulty: 7,
  },
];

for (const spot of FISHING) {
  OBJECT_LIST.push({
    id: `fish_${spot.id}`,
    name: spot.name,
    examine: "Some fish are swimming here.",
    blocking: false,
    flat: true,
    art: { kind: "ripple" },
    gather: {
      skill: "fishing",
      level: spot.level,
      xp: spot.xp,
      item: spot.item,
      tool: spot.tool,
      action: spot.action,
      difficulty: spot.difficulty,
    },
  });
}

OBJECT_LIST.push(
  {
    id: "rock_empty",
    name: "Rocks",
    examine: "There is nothing left in this rock.",
    blocking: true,
    art: { kind: "rock", body: "#8d857c", vein: null },
  },
  {
    id: "wall_stone",
    name: "Wall",
    examine: "A sturdy stone wall.",
    blocking: true,
    art: { kind: "wall", face: "#8b8b84", top: "#a3a39a" },
  },
  {
    id: "wall_wood",
    name: "Wall",
    examine: "A wooden wall.",
    blocking: true,
    art: { kind: "wall", face: "#9a7440", top: "#bd9256" },
  },
  {
    id: "fence",
    name: "Fence",
    examine: "A wooden fence.",
    blocking: true,
    art: { kind: "fence" },
  },
  {
    id: "gate",
    name: "Gate",
    examine: "A gate. It swings freely.",
    blocking: false,
    flat: true,
    art: { kind: "gate" },
  },
  {
    id: "fire",
    name: "Fire",
    examine: "A fire. It is nice and toasty.",
    blocking: false,
    flat: true,
    use: "cook",
    art: { kind: "fire" },
  },
  {
    id: "range",
    name: "Range",
    examine: "A hot stove for cooking on.",
    blocking: true,
    use: "cook",
    art: { kind: "range" },
  },
  {
    id: "furnace",
    name: "Furnace",
    examine: "Hot enough to melt ore.",
    blocking: true,
    use: "smelt",
    art: { kind: "furnace" },
  },
  {
    id: "anvil",
    name: "Anvil",
    examine: "Useful for hammering metal into shape.",
    blocking: true,
    use: "smith",
    art: { kind: "anvil" },
  },
  {
    id: "boat",
    name: "Boat",
    examine: "A small rowing boat.",
    blocking: true,
    art: { kind: "boat" },
  },
  {
    id: "tut_door",
    name: "Door",
    examine: "A sturdy wooden door.",
    blocking: true,
    art: { kind: "door", colour: "#7a5230" },
  },
  {
    id: "bank_chest",
    name: "Bank chest",
    examine: "Deposit your items here for safe keeping.",
    blocking: true,
    use: "bank",
    art: { kind: "chest", colour: "#8a6a3c" },
  },
  {
    id: "shop_counter",
    name: "Shop counter",
    examine: "The general store counter.",
    blocking: true,
    use: "shop",
    art: { kind: "counter", colour: "#8a6a3c" },
  },
  {
    id: "bush",
    name: "Bush",
    examine: "A leafy bush.",
    blocking: true,
    art: { kind: "bush", colour: "#2f6a2a" },
  },
  {
    id: "flowers",
    name: "Flowers",
    examine: "Pretty flowers.",
    blocking: false,
    flat: true,
    art: { kind: "flowers", colour: "#e8d24a" },
  },
  {
    id: "well",
    name: "Well",
    examine: "A deep well. Don't fall in.",
    blocking: true,
    art: { kind: "well" },
  },
  {
    id: "altar",
    name: "Altar",
    examine: "A stone altar.",
    blocking: true,
    art: { kind: "altar" },
  },
  {
    id: "table",
    name: "Table",
    examine: "A wooden table.",
    blocking: true,
    art: { kind: "table" },
  },
  {
    id: "sign_town",
    name: "Sign",
    examine: "It reads: Lumbridge.",
    blocking: true,
    art: { kind: "sign", text: "Lumbridge" },
  },
);

export const OBJECTS: Record<string, ObjectDef> = Object.fromEntries(
  OBJECT_LIST.map((def) => [def.id, def]),
);

export function getObjectDef(id: string): ObjectDef {
  const def = OBJECTS[id];
  if (!def) throw new Error(`Unknown object: ${id}`);
  return def;
}

export interface WorldObject {
  index: number;
  defId: string;
  x: number;
  y: number;
  /** Tick at which a depleted resource returns, or a fire burns out. */
  readyAt?: number;
  /** Object to restore when `readyAt` passes. Absent means remove. */
  restoreTo?: string;
  /** For a tutorial door: the stage that must be finished before it opens. */
  stage?: number;
  /** For a shop counter: which shop it opens. */
  shopId?: string;
}

export interface NpcSpawn {
  defId: string;
  x: number;
  y: number;
  radius: number;
  count: number;
}

export interface RegionLabel {
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
}

export interface WorldMap {
  size: number;
  terrain: Uint8Array;
  /** One scenery object per tile, indexed the same way as `terrain`. */
  objects: (WorldObject | undefined)[];
  spawns: NpcSpawn[];
  labels: RegionLabel[];
}

export function tileIndex(map: WorldMap, x: number, y: number): number {
  return y * map.size + x;
}

export function inBounds(map: WorldMap, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < map.size && y < map.size;
}

export function terrainAt(map: WorldMap, x: number, y: number): TerrainId {
  if (!inBounds(map, x, y)) return TERRAIN.water;
  return map.terrain[tileIndex(map, x, y)] as TerrainId;
}

export function objectAt(
  map: WorldMap,
  x: number,
  y: number,
): WorldObject | undefined {
  if (!inBounds(map, x, y)) return undefined;
  return map.objects[tileIndex(map, x, y)];
}

export function isWalkable(map: WorldMap, x: number, y: number): boolean {
  if (!inBounds(map, x, y)) return false;
  const index = tileIndex(map, x, y);
  if (!TERRAIN_DEFS[map.terrain[index] as TerrainId].walkable) return false;
  const object = map.objects[index];
  return !object || !getObjectDef(object.defId).blocking;
}

/** Name of the region a tile sits in, shown above the minimap. */
export function regionAt(map: WorldMap, x: number, y: number): string {
  for (const label of map.labels) {
    if (
      x >= label.x &&
      y >= label.y &&
      x < label.x + label.w &&
      y < label.y + label.h
    ) {
      return label.text;
    }
  }
  return "Wilderness";
}

export function setObject(
  map: WorldMap,
  x: number,
  y: number,
  defId: string | null,
): void {
  const index = tileIndex(map, x, y);
  map.objects[index] = defId ? { index, defId, x, y } : undefined;
}
