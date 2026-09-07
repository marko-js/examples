/** NPC definitions: stats, wandering behaviour, drop tables, and sprite colours. */
import { combatLevel, type SkillId } from "./skills";

export type NpcSprite =
  | {
      kind: "humanoid";
      skin: string;
      hair: string;
      shirt: string;
      legs: string;
      height: number;
    }
  | {
      kind: "beast";
      body: string;
      belly: string;
      snout: string;
      width: number;
      height: number;
      tail: boolean;
      horns: boolean;
    }
  | { kind: "bird"; body: string; wing: string; beak: string; comb: string };

export interface DropEntry {
  id: string;
  min?: number;
  max?: number;
  /** Relative weight within the random half of the table. */
  weight: number;
}

export interface NpcDef {
  id: string;
  name: string;
  examine: string;
  levels: Record<"attack" | "defense" | "strength" | "hits", number>;
  bonus: { aim: number; power: number; armour: number };
  attackable: boolean;
  aggressive: boolean;
  /** Tiles from its spawn point the NPC will roam. */
  wander: number;
  respawnTicks: number;
  /** Always dropped on death. */
  always: string[];
  /** One entry is rolled from this weighted table on death. */
  drops: DropEntry[];
  sprite: NpcSprite;
  role?: "bank" | "shop";
  chat?: string[];
}

const NPC_LIST: NpcDef[] = [
  {
    id: "chicken",
    name: "Chicken",
    examine: "Yep, definitely a chicken.",
    levels: { attack: 1, defense: 1, strength: 1, hits: 3 },
    bonus: { aim: 0, power: 0, armour: 0 },
    attackable: true,
    aggressive: false,
    wander: 4,
    respawnTicks: 25,
    always: ["bones"],
    drops: [{ id: "feather", min: 5, max: 15, weight: 1 }],
    sprite: {
      kind: "bird",
      body: "#f0eee6",
      wing: "#d8d4c6",
      beak: "#e0a52a",
      comb: "#c43a2f",
    },
  },
  {
    id: "rat",
    name: "Rat",
    examine: "A vicious looking rodent.",
    levels: { attack: 3, defense: 2, strength: 2, hits: 5 },
    bonus: { aim: 2, power: 2, armour: 1 },
    attackable: true,
    aggressive: false,
    wander: 5,
    respawnTicks: 25,
    always: ["bones"],
    drops: [],
    sprite: {
      kind: "beast",
      body: "#6b6157",
      belly: "#8a8076",
      snout: "#c99a9a",
      width: 0.7,
      height: 0.45,
      tail: true,
      horns: false,
    },
  },
  {
    id: "giant_rat",
    name: "Giant rat",
    examine: "Now that is a big rat.",
    levels: { attack: 8, defense: 6, strength: 7, hits: 14 },
    bonus: { aim: 8, power: 8, armour: 6 },
    attackable: true,
    aggressive: true,
    wander: 6,
    respawnTicks: 35,
    always: ["bones"],
    drops: [{ id: "coins", min: 1, max: 8, weight: 3 }],
    sprite: {
      kind: "beast",
      body: "#57503f",
      belly: "#7a7160",
      snout: "#c99a9a",
      width: 1,
      height: 0.65,
      tail: true,
      horns: false,
    },
  },
  {
    id: "cow",
    name: "Cow",
    examine: "Converts grass into beef.",
    levels: { attack: 2, defense: 2, strength: 3, hits: 8 },
    bonus: { aim: 1, power: 2, armour: 2 },
    attackable: true,
    aggressive: false,
    wander: 5,
    respawnTicks: 30,
    always: ["bones"],
    drops: [],
    sprite: {
      kind: "beast",
      body: "#e8e4dc",
      belly: "#3a3530",
      snout: "#e0a8a8",
      width: 1.1,
      height: 0.8,
      tail: true,
      horns: true,
    },
  },
  {
    id: "goblin",
    name: "Goblin",
    examine: "An ugly green creature.",
    levels: { attack: 6, defense: 6, strength: 6, hits: 12 },
    bonus: { aim: 6, power: 6, armour: 6 },
    attackable: true,
    aggressive: true,
    wander: 6,
    respawnTicks: 30,
    always: ["bones"],
    drops: [
      { id: "coins", min: 3, max: 24, weight: 8 },
      { id: "bronze_sword", weight: 2 },
      { id: "bronze_shield", weight: 2 },
      { id: "bronze_helmet", weight: 1 },
    ],
    sprite: {
      kind: "humanoid",
      skin: "#5f8a3f",
      hair: "#3f5c2a",
      shirt: "#8a4a2c",
      legs: "#4a3a28",
      height: 0.85,
    },
  },
  {
    id: "man",
    name: "Man",
    examine: "One of Lumbridge's citizens.",
    levels: { attack: 4, defense: 4, strength: 4, hits: 12 },
    bonus: { aim: 3, power: 3, armour: 3 },
    attackable: true,
    aggressive: false,
    wander: 7,
    respawnTicks: 30,
    always: ["bones"],
    drops: [
      { id: "coins", min: 2, max: 30, weight: 6 },
      { id: "bread", weight: 2 },
    ],
    sprite: {
      kind: "humanoid",
      skin: "#d8a87a",
      hair: "#4a3524",
      shirt: "#4f6f9a",
      legs: "#3c3c4a",
      height: 1,
    },
  },
  {
    id: "guard",
    name: "Guard",
    examine: "He is on the lookout for trouble.",
    levels: { attack: 20, defense: 20, strength: 18, hits: 22 },
    bonus: { aim: 22, power: 20, armour: 26 },
    attackable: true,
    aggressive: false,
    wander: 4,
    respawnTicks: 45,
    always: ["bones"],
    drops: [
      { id: "coins", min: 10, max: 60, weight: 8 },
      { id: "iron_sword", weight: 2 },
      { id: "steel_helmet", weight: 1 },
    ],
    sprite: {
      kind: "humanoid",
      skin: "#d8a87a",
      hair: "#2e2418",
      shirt: "#8b8b94",
      legs: "#5a5a62",
      height: 1.05,
    },
  },
  {
    id: "skeleton",
    name: "Skeleton",
    examine: "It has seen better days.",
    levels: { attack: 22, defense: 20, strength: 22, hits: 24 },
    bonus: { aim: 24, power: 24, armour: 20 },
    attackable: true,
    aggressive: true,
    wander: 5,
    respawnTicks: 50,
    always: ["bones"],
    drops: [
      { id: "coins", min: 15, max: 80, weight: 8 },
      { id: "steel_sword", weight: 2 },
      { id: "mithril_helmet", weight: 1 },
    ],
    sprite: {
      kind: "humanoid",
      skin: "#e4e0d2",
      hair: "#c8c4b4",
      shirt: "#c4c0b0",
      legs: "#b0ac9c",
      height: 1,
    },
  },
  {
    id: "hobgoblin",
    name: "Hobgoblin",
    examine: "A large goblin with a nasty temper.",
    levels: { attack: 30, defense: 28, strength: 30, hits: 36 },
    bonus: { aim: 34, power: 34, armour: 30 },
    attackable: true,
    aggressive: true,
    wander: 6,
    respawnTicks: 60,
    always: ["big_bones"],
    drops: [
      { id: "coins", min: 25, max: 140, weight: 9 },
      { id: "mithril_sword", weight: 2 },
      { id: "adamantite_helmet", weight: 1 },
    ],
    sprite: {
      kind: "humanoid",
      skin: "#7a9a4a",
      hair: "#3f5c2a",
      shirt: "#5a4a6a",
      legs: "#3a3020",
      height: 1.15,
    },
  },
  {
    id: "banker",
    name: "Banker",
    examine: "He can look after my items for me.",
    levels: { attack: 1, defense: 1, strength: 1, hits: 20 },
    bonus: { aim: 0, power: 0, armour: 0 },
    attackable: false,
    aggressive: false,
    wander: 0,
    respawnTicks: 0,
    always: [],
    drops: [],
    role: "bank",
    chat: ["Good day, how may I help you?"],
    sprite: {
      kind: "humanoid",
      skin: "#d8a87a",
      hair: "#5a4632",
      shirt: "#2f4f7a",
      legs: "#23232c",
      height: 1,
    },
  },
  {
    id: "shopkeeper",
    name: "Shopkeeper",
    examine: "He owns the general store.",
    levels: { attack: 1, defense: 1, strength: 1, hits: 20 },
    bonus: { aim: 0, power: 0, armour: 0 },
    attackable: false,
    aggressive: false,
    wander: 0,
    respawnTicks: 0,
    always: [],
    drops: [],
    role: "shop",
    chat: ["Can I help you at all?"],
    sprite: {
      kind: "humanoid",
      skin: "#c99a68",
      hair: "#7a6a4a",
      shirt: "#7a3f3f",
      legs: "#4a3a28",
      height: 1,
    },
  },
];

export const NPCS: Record<string, NpcDef> = Object.fromEntries(
  NPC_LIST.map((def) => [def.id, def]),
);

export function getNpcDef(id: string): NpcDef {
  const def = NPCS[id];
  if (!def) throw new Error(`Unknown npc: ${id}`);
  return def;
}

/** Combat level shown beside an NPC's name, using the same formula as players. */
export function npcCombatLevel(def: NpcDef): number {
  const levels = {
    ...def.levels,
    prayer: 1,
    magic: 1,
  } as unknown as Record<SkillId, number>;
  return combatLevel(levels);
}
