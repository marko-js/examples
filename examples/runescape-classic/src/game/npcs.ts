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
  levels: Record<"attack" | "defence" | "strength" | "hitpoints", number> &
    Partial<Record<"magic" | "ranged", number>>;
  /**
   * The combat level the game shows. Monster levels are assigned rather than
   * derived, so a few sit off what the player formula would give.
   */
  combat?: number;
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
  /** Key into the tutorial dialogue scripts, for instructors. */
  dialogue?: string;
}

/**
 * Levels and bonuses are the published monster stats. `armour` is the slash
 * defence bonus, the one most melee attacks are rolled against.
 *
 * https://oldschool.runescape.wiki/w/Monster
 */
const NPC_LIST: NpcDef[] = [
  {
    id: "chicken",
    name: "Chicken",
    examine: "Yep, definitely a chicken.",
    levels: { attack: 1, defence: 1, strength: 1, hitpoints: 3 },
    combat: 1,
    bonus: { aim: -47, power: -42, armour: -42 },
    attackable: true,
    aggressive: false,
    wander: 4,
    respawnTicks: 25,
    always: ["bones", "raw_chicken"],
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
    levels: { attack: 1, defence: 1, strength: 1, hitpoints: 2 },
    combat: 1,
    bonus: { aim: 0, power: 0, armour: 0 },
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
    levels: { attack: 2, defence: 2, strength: 3, hitpoints: 5 },
    combat: 3,
    bonus: { aim: 0, power: 0, armour: 0 },
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
    levels: { attack: 1, defence: 1, strength: 1, hitpoints: 8 },
    combat: 2,
    bonus: { aim: -15, power: -15, armour: -21 },
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
    levels: { attack: 1, defence: 1, strength: 1, hitpoints: 5 },
    combat: 2,
    bonus: { aim: -15, power: -15, armour: -15 },
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
    levels: { attack: 1, defence: 1, strength: 1, hitpoints: 7 },
    combat: 2,
    bonus: { aim: 0, power: 0, armour: -21 },
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
    levels: { attack: 19, defence: 14, strength: 18, hitpoints: 22 },
    combat: 21,
    bonus: { aim: 4, power: 5, armour: 25 },
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
    levels: { attack: 15, defence: 17, strength: 18, hitpoints: 29 },
    combat: 22,
    bonus: { aim: 0, power: 0, armour: 5 },
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
    levels: { attack: 22, defence: 24, strength: 24, hitpoints: 29 },
    combat: 28,
    bonus: { aim: 0, power: 0, armour: 0 },
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
    levels: { attack: 1, defence: 1, strength: 1, hitpoints: 20 },
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
    levels: { attack: 1, defence: 1, strength: 1, hitpoints: 20 },
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

/* Tutorial Island instructors. They cannot be attacked and never wander. */

const INSTRUCTORS: {
  id: string;
  name: string;
  examine: string;
  shirt: string;
  legs: string;
  hair: string;
}[] = [
  {
    id: "gielinor_guide",
    name: "Gielinor Guide",
    examine: "He welcomes new arrivals to Gielinor.",
    shirt: "#7a3f8a",
    legs: "#3c3c4a",
    hair: "#8a8a8a",
  },
  {
    id: "survival_expert",
    name: "Survival Expert",
    examine: "She knows her way around the wild.",
    shirt: "#3f7a4f",
    legs: "#4a3a28",
    hair: "#8a5a2a",
  },
  {
    id: "master_chef",
    name: "Master Chef",
    examine: "Something smells good.",
    shirt: "#e8e4dc",
    legs: "#8a8a8a",
    hair: "#4a3524",
  },
  {
    id: "quest_guide",
    name: "Quest Guide",
    examine: "He knows a tale or two.",
    shirt: "#7a5a2f",
    legs: "#3c3c4a",
    hair: "#c8c4b4",
  },
  {
    id: "mining_instructor",
    name: "Mining Instructor",
    examine: "A veteran of the rocks.",
    shirt: "#6b5334",
    legs: "#4a3a28",
    hair: "#3a2a18",
  },
  {
    id: "combat_instructor",
    name: "Combat Instructor",
    examine: "He looks like he can handle himself.",
    shirt: "#8b8b94",
    legs: "#5a5a62",
    hair: "#2e2418",
  },
  {
    id: "account_guide",
    name: "Account Guide",
    examine: "He looks after the paperwork.",
    shirt: "#2f4f7a",
    legs: "#23232c",
    hair: "#5a4632",
  },
  {
    id: "brother_brace",
    name: "Brother Brace",
    examine: "A monk of Saradomin.",
    shirt: "#e0d8c0",
    legs: "#c8c0a8",
    hair: "#6a5a3a",
  },
  {
    id: "magic_instructor",
    name: "Magic Instructor",
    examine: "There is good magic potential in this one.",
    shirt: "#3f3f8a",
    legs: "#2a2a5a",
    hair: "#c8c4b4",
  },
];

for (const person of INSTRUCTORS) {
  NPC_LIST.push({
    id: person.id,
    name: person.name,
    examine: person.examine,
    levels: { attack: 1, defence: 1, strength: 1, hitpoints: 20 },
    bonus: { aim: 0, power: 0, armour: 0 },
    attackable: false,
    aggressive: false,
    wander: 0,
    respawnTicks: 0,
    always: [],
    drops: [],
    dialogue: person.id,
    sprite: {
      kind: "humanoid",
      skin: "#d8a87a",
      hair: person.hair,
      shirt: person.shirt,
      legs: person.legs,
      height: 1,
    },
  });
}

NPC_LIST.push(
  {
    id: "barbarian",
    name: "Barbarian",
    examine: "He looks like he enjoys a fight.",
    levels: { attack: 6, defence: 5, strength: 5, hitpoints: 14 },
    combat: 8,
    bonus: { aim: 8, power: 10, armour: 1 },
    attackable: true,
    aggressive: false,
    wander: 5,
    respawnTicks: 40,
    always: ["bones"],
    drops: [
      { id: "coins", min: 5, max: 45, weight: 8 },
      { id: "iron_sword", weight: 2 },
      { id: "bronze_platebody", weight: 2 },
    ],
    sprite: {
      kind: "humanoid",
      skin: "#d8a87a",
      hair: "#b06a2a",
      shirt: "#8a4a2c",
      legs: "#4a3a28",
      height: 1.05,
    },
  },
  {
    id: "dark_wizard",
    name: "Dark wizard",
    examine: "He is up to no good.",
    levels: { attack: 5, defence: 5, strength: 2, hitpoints: 12, magic: 6 },
    combat: 7,
    bonus: { aim: 0, power: 0, armour: 0 },
    attackable: true,
    aggressive: true,
    wander: 4,
    respawnTicks: 45,
    always: ["bones"],
    drops: [
      { id: "air_rune", min: 3, max: 12, weight: 6 },
      { id: "mind_rune", min: 2, max: 8, weight: 5 },
      { id: "coins", min: 5, max: 30, weight: 4 },
    ],
    sprite: {
      kind: "humanoid",
      skin: "#c9a884",
      hair: "#2a2a2a",
      shirt: "#2a2a3a",
      legs: "#1f1f2a",
      height: 1,
    },
  },
  {
    id: "monk",
    name: "Monk",
    examine: "A monk of Saradomin.",
    levels: { attack: 2, defence: 3, strength: 2, hitpoints: 5 },
    combat: 5,
    bonus: { aim: 0, power: 0, armour: 0 },
    attackable: false,
    aggressive: false,
    wander: 4,
    respawnTicks: 0,
    always: [],
    drops: [],
    chat: ["May Saradomin watch over you."],
    sprite: {
      kind: "humanoid",
      skin: "#d8a87a",
      hair: "#6a5a3a",
      shirt: "#e0d8c0",
      legs: "#c8c0a8",
      height: 1,
    },
  },
  {
    id: "white_knight",
    name: "White Knight",
    examine: "A knight of Falador.",
    levels: { attack: 27, defence: 21, strength: 29, hitpoints: 52 },
    combat: 36,
    bonus: { aim: 30, power: 31, armour: 76 },
    attackable: true,
    aggressive: false,
    wander: 3,
    respawnTicks: 50,
    always: ["bones"],
    drops: [
      { id: "coins", min: 15, max: 90, weight: 8 },
      { id: "steel_sword", weight: 2 },
      { id: "steel_platebody", weight: 1 },
    ],
    sprite: {
      kind: "humanoid",
      skin: "#d8a87a",
      hair: "#c8c4b4",
      shirt: "#e6e6ee",
      legs: "#b6b6c2",
      height: 1.05,
    },
  },
  {
    id: "tutorial_rat",
    name: "Rat",
    examine: "A vicious looking rodent.",
    levels: { attack: 1, defence: 1, strength: 1, hitpoints: 5 },
    bonus: { aim: 0, power: 0, armour: 0 },
    attackable: true,
    aggressive: false,
    wander: 3,
    respawnTicks: 20,
    always: [],
    drops: [],
    sprite: {
      kind: "beast",
      body: "#6b6157",
      belly: "#8a8076",
      snout: "#c99a9a",
      width: 0.8,
      height: 0.5,
      tail: true,
      horns: false,
    },
  },
  {
    id: "tutorial_chicken",
    name: "Chicken",
    examine: "Yep, definitely a chicken.",
    levels: { attack: 1, defence: 1, strength: 1, hitpoints: 3 },
    bonus: { aim: 0, power: 0, armour: 0 },
    attackable: true,
    aggressive: false,
    wander: 3,
    respawnTicks: 20,
    always: [],
    drops: [],
    sprite: {
      kind: "bird",
      body: "#f0eee6",
      wing: "#d8d4c6",
      beak: "#e0a52a",
      comb: "#c43a2f",
    },
  },
);

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
  if (def.combat !== undefined) return def.combat;
  const levels = {
    ranged: 1,
    prayer: 1,
    magic: 1,
    ...def.levels,
  } as unknown as Record<SkillId, number>;
  return combatLevel(levels);
}
