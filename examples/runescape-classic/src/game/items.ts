/** Every item in the game, plus the metal tier ladder the gear is built from. */
import {
  arrowIcon,
  axeIcon,
  barIcon,
  bodyIcon,
  bonesIcon,
  bowIcon,
  breadIcon,
  bucketIcon,
  coinsIcon,
  daggerIcon,
  doughIcon,
  featherIcon,
  fishIcon,
  hammerIcon,
  helmetIcon,
  type Icon,
  legsIcon,
  logsIcon,
  longswordIcon,
  meatIcon,
  netIcon,
  oreIcon,
  pickaxeIcon,
  potIcon,
  rodIcon,
  runeIcon,
  shieldIcon,
  shieldWoodIcon,
  sleepingBagIcon,
  swordIcon,
  tinderboxIcon,
} from "./icons";
import type { SkillId } from "./skills";

export type EquipSlot =
  "weapon" | "ammo" | "shield" | "helmet" | "body" | "legs" | "amulet" | "cape";

export const EQUIP_SLOTS: EquipSlot[] = [
  "helmet",
  "amulet",
  "cape",
  "body",
  "legs",
  "weapon",
  "shield",
  "ammo",
];

export const EQUIP_SLOT_NAMES: Record<EquipSlot, string> = {
  ammo: "Ammo",
  helmet: "Head",
  amulet: "Neck",
  cape: "Back",
  body: "Body",
  legs: "Legs",
  weapon: "Weapon",
  shield: "Shield",
};

/** The five item stats RuneScape Classic tracked. */
export interface Bonus {
  aim: number;
  power: number;
  armour: number;
  magic: number;
  prayer: number;
}

export interface EquipDef {
  slot: EquipSlot;
  bonus: Partial<Bonus>;
  /** Skill requirement to wear or wield. */
  requires?: { skill: SkillId; level: number };
  /** Colour the character sprite paints this slot with. */
  colour: string;
}

export interface CookDef {
  into: string;
  level: number;
  xp: number;
  /** Item produced when the cook fails. */
  burnt: string;
}

export interface ItemDef {
  id: string;
  name: string;
  examine: string;
  /** Base shop price in coins. */
  value: number;
  stackable?: boolean;
  icon: Icon;
  equip?: EquipDef;
  /** Hits restored when eaten. */
  heals?: number;
  /** Prayer experience granted when buried. */
  buryXp?: number;
  /** Marks the item as a gathering tool of the given kind and tier. */
  tool?: { kind: ToolKind; tier: number };
  /** Firemaking experience, present on anything that can be lit. */
  burnXp?: number;
  burnLevel?: number;
  cook?: CookDef;
  /** What a bar becomes when hammered on an anvil. */
  smith?: { into: string; level: number; xp: number };
}

export type ToolKind =
  "axe" | "pickaxe" | "tinderbox" | "net" | "rod" | "pot" | "hammer";

export interface Metal {
  id: string;
  name: string;
  tier: number;
  level: number;
  colour: string;
  shine: string;
}

export const METALS: Metal[] = [
  {
    id: "bronze",
    name: "Bronze",
    tier: 0,
    level: 1,
    colour: "#a97142",
    shine: "#cd9560",
  },
  {
    id: "iron",
    name: "Iron",
    tier: 1,
    level: 1,
    colour: "#6e6e6e",
    shine: "#949494",
  },
  {
    id: "steel",
    name: "Steel",
    tier: 2,
    level: 5,
    colour: "#b0b0ba",
    shine: "#dcdce4",
  },
  {
    id: "black",
    name: "Black",
    tier: 3,
    level: 10,
    colour: "#3b3b45",
    shine: "#5a5a66",
  },
  {
    id: "mithril",
    name: "Mithril",
    tier: 4,
    level: 20,
    colour: "#4d5da6",
    shine: "#7f8ed6",
  },
  {
    id: "adamantite",
    name: "Adamantite",
    tier: 5,
    level: 30,
    colour: "#3f7f5f",
    shine: "#5fae85",
  },
  {
    id: "rune",
    name: "Rune",
    tier: 6,
    level: 40,
    colour: "#3fa6b8",
    shine: "#78d6e8",
  },
];

const defs: ItemDef[] = [];

function define(def: ItemDef): string {
  defs.push(def);
  return def.id;
}

for (const metal of METALS) {
  const { id, name, tier, level, colour, shine } = metal;
  const gearValue = (mult: number) =>
    Math.round((12 + tier * tier * 22) * mult);
  const attack = { skill: "attack" as SkillId, level };
  const defence = { skill: "defence" as SkillId, level };

  define({
    id: `${id}_sword`,
    name: `${name} sword`,
    examine: "A razor sharp sword.",
    value: gearValue(1),
    icon: swordIcon(colour, shine),
    equip: {
      slot: "weapon",
      colour,
      requires: attack,
      bonus: { aim: 5 + tier * 7, power: 5 + tier * 7 },
    },
  });
  define({
    id: `${id}_axe`,
    name: `${name} axe`,
    examine: "A woodcutting axe. It works as a weapon in a pinch.",
    value: gearValue(0.7),
    icon: axeIcon(colour, shine),
    tool: { kind: "axe", tier },
    equip: {
      slot: "weapon",
      colour,
      requires: attack,
      bonus: { aim: 3 + tier * 5, power: 4 + tier * 5 },
    },
  });
  define({
    id: `${id}_pickaxe`,
    name: `${name} pickaxe`,
    examine: "Used for mining rocks.",
    value: gearValue(0.8),
    icon: pickaxeIcon(colour, shine),
    tool: { kind: "pickaxe", tier },
    equip: {
      slot: "weapon",
      colour,
      requires: attack,
      bonus: { aim: 2 + tier * 4, power: 3 + tier * 4 },
    },
  });
  define({
    id: `${id}_helmet`,
    name: `${name} helmet`,
    examine: "A medium sized helmet.",
    value: gearValue(0.9),
    icon: helmetIcon(colour, shine),
    equip: {
      slot: "helmet",
      colour,
      requires: defence,
      bonus: { armour: 3 + tier * 4 },
    },
  });
  define({
    id: `${id}_platebody`,
    name: `${name} platemail body`,
    examine: "A solid platemail body.",
    value: gearValue(2.6),
    icon: bodyIcon(colour, shine),
    equip: {
      slot: "body",
      colour,
      requires: defence,
      bonus: { armour: 6 + tier * 8 },
    },
  });
  define({
    id: `${id}_platelegs`,
    name: `${name} platemail legs`,
    examine: "Platemail leg armour.",
    value: gearValue(1.8),
    icon: legsIcon(colour, shine),
    equip: {
      slot: "legs",
      colour,
      requires: defence,
      bonus: { armour: 4 + tier * 6 },
    },
  });
  define({
    id: `${id}_shield`,
    name: `${name} square shield`,
    examine: "A medium square shield.",
    value: gearValue(1.4),
    icon: shieldIcon(colour, shine),
    equip: {
      slot: "shield",
      colour,
      requires: defence,
      bonus: { armour: 4 + tier * 5 },
    },
  });
}

define({
  id: "coins",
  name: "Coins",
  examine: "Lovely money!",
  value: 1,
  stackable: true,
  icon: coinsIcon(),
});

define({
  id: "logs",
  name: "Logs",
  examine: "A number of wooden logs.",
  value: 4,
  icon: logsIcon("#7a5230", "#a97142"),
  burnXp: 40,
  burnLevel: 1,
});
define({
  id: "oak_logs",
  name: "Oak logs",
  examine: "Logs cut from an oak tree.",
  value: 12,
  icon: logsIcon("#5f4326", "#8a6136"),
  burnXp: 60,
  burnLevel: 15,
});
define({
  id: "willow_logs",
  name: "Willow logs",
  examine: "Logs cut from a willow tree.",
  value: 24,
  icon: logsIcon("#6b6237", "#95894c"),
  burnXp: 90,
  burnLevel: 30,
});
define({
  id: "maple_logs",
  name: "Maple logs",
  examine: "Logs cut from a maple tree.",
  value: 48,
  icon: logsIcon("#8a4a2c", "#b06a3f"),
  burnXp: 135,
  burnLevel: 45,
});

define({
  id: "copper_ore",
  name: "Copper ore",
  examine: "This needs refining.",
  value: 6,
  icon: oreIcon("#6d6560", "#c1662f"),
});
define({
  id: "tin_ore",
  name: "Tin ore",
  examine: "This needs refining.",
  value: 6,
  icon: oreIcon("#6d6560", "#b6c0c6"),
});
define({
  id: "iron_ore",
  name: "Iron ore",
  examine: "This needs refining.",
  value: 20,
  icon: oreIcon("#6d6560", "#8a4b3a"),
});
define({
  id: "coal",
  name: "Coal",
  examine: "Hmm, a non renewable energy source.",
  value: 45,
  icon: oreIcon("#3d3b3a", "#151515"),
});
define({
  id: "gold_ore",
  name: "Gold ore",
  examine: "This needs refining.",
  value: 150,
  icon: oreIcon("#6d6560", "#e2b32c"),
});
define({
  id: "mithril_ore",
  name: "Mithril ore",
  examine: "This needs refining.",
  value: 240,
  icon: oreIcon("#6d6560", "#4d5da6"),
});

define({
  id: "burnt_fish",
  name: "Burnt fish",
  examine: "Yuck, I don't want to eat that.",
  value: 1,
  icon: fishIcon("#3a2c22", "#241a14", false),
});

const FISH: {
  id: string;
  name: string;
  heals: number;
  value: number;
  level: number;
  xp: number;
  body: string;
  fin: string;
}[] = [
  {
    id: "shrimp",
    name: "Shrimp",
    heals: 3,
    value: 5,
    level: 1,
    xp: 30,
    body: "#e08a5a",
    fin: "#c26f45",
  },
  {
    id: "sardine",
    name: "Sardine",
    heals: 4,
    value: 8,
    level: 1,
    xp: 40,
    body: "#8fa5b8",
    fin: "#6f8598",
  },
  {
    id: "trout",
    name: "Trout",
    heals: 7,
    value: 20,
    level: 15,
    xp: 70,
    body: "#9db089",
    fin: "#7c8f6b",
  },
  {
    id: "salmon",
    name: "Salmon",
    heals: 9,
    value: 35,
    level: 25,
    xp: 90,
    body: "#e0866f",
    fin: "#bd6a55",
  },
  {
    id: "lobster",
    name: "Lobster",
    heals: 12,
    value: 70,
    level: 40,
    xp: 120,
    body: "#c9422f",
    fin: "#a3311f",
  },
];

for (const fish of FISH) {
  define({
    id: `raw_${fish.id}`,
    name: `Raw ${fish.name.toLowerCase()}`,
    examine: "I should cook this first.",
    value: Math.max(1, Math.round(fish.value * 0.6)),
    icon: fishIcon(fish.body, fish.fin, true),
    cook: {
      into: fish.id,
      level: fish.level,
      xp: fish.xp,
      burnt: "burnt_fish",
    },
  });
  define({
    id: fish.id,
    name: fish.name,
    examine: "It looks tasty.",
    value: fish.value,
    icon: fishIcon(lighten(fish.body), lighten(fish.fin), false),
    heals: fish.heals,
  });
}

define({
  id: "bread",
  name: "Bread",
  examine: "Nice and crispy.",
  value: 12,
  icon: breadIcon(),
  heals: 5,
});

define({
  id: "bones",
  name: "Bones",
  examine: "These would be worth burying.",
  value: 1,
  icon: bonesIcon(false),
  buryXp: 15,
});
define({
  id: "big_bones",
  name: "Big bones",
  examine: "Bones from something large.",
  value: 1,
  icon: bonesIcon(true),
  buryXp: 45,
});
define({
  id: "feather",
  name: "Feather",
  examine: "A brown feather.",
  value: 2,
  stackable: true,
  icon: featherIcon(),
});

define({
  id: "tinderbox",
  name: "Tinderbox",
  examine: "Useful for lighting a fire.",
  value: 8,
  icon: tinderboxIcon(),
  tool: { kind: "tinderbox", tier: 0 },
});
define({
  id: "small_net",
  name: "Small net",
  examine: "Useful for catching small fish.",
  value: 10,
  icon: netIcon(),
  tool: { kind: "net", tier: 0 },
});
define({
  id: "fishing_rod",
  name: "Fishing rod",
  examine: "A rod for catching larger fish.",
  value: 20,
  icon: rodIcon(),
  tool: { kind: "rod", tier: 0 },
});
define({
  id: "lobster_pot",
  name: "Lobster pot",
  examine: "A cage for catching lobsters.",
  value: 40,
  icon: potIcon("#c9422f"),
  tool: { kind: "pot", tier: 0 },
});

/* Tutorial Island kit, and the smithing chain the Mining Instructor teaches. */

define({
  id: "bronze_dagger",
  name: "Bronze dagger",
  examine: "A short, stabbing blade.",
  value: 10,
  icon: daggerIcon("#a97142", "#cd9560"),
  equip: {
    slot: "weapon",
    colour: "#a97142",
    requires: { skill: "attack", level: 1 },
    bonus: { aim: 4, power: 3 },
  },
});
define({
  id: "shortbow",
  name: "Shortbow",
  examine: "A bow made from a bent stick and some string.",
  value: 50,
  icon: bowIcon(),
  equip: {
    slot: "weapon",
    colour: "#7a5230",
    requires: { skill: "ranged", level: 1 },
    bonus: { aim: 8, power: 0 },
  },
});
define({
  id: "bronze_arrows",
  name: "Bronze arrows",
  examine: "Arrows with bronze tips.",
  value: 1,
  stackable: true,
  icon: arrowIcon("#a97142"),
  equip: { slot: "ammo", colour: "#a97142", bonus: { power: 7 } },
});
define({
  id: "hammer",
  name: "Hammer",
  examine: "Good for hitting things.",
  value: 12,
  icon: hammerIcon(),
  tool: { kind: "hammer", tier: 0 },
});
define({
  id: "bronze_bar",
  name: "Bronze bar",
  examine: "It is a bar of bronze.",
  value: 20,
  icon: barIcon("#a97142", "#cd9560"),
  smith: { into: "bronze_dagger", level: 1, xp: 12 },
});
define({
  id: "pot_of_flour",
  name: "Pot of flour",
  examine: "A pot filled with flour.",
  value: 10,
  icon: potIcon("#f2e6c8"),
});
define({
  id: "bucket_of_water",
  name: "Bucket of water",
  examine: "A bucket filled with water.",
  value: 10,
  icon: bucketIcon("#3f7ac9"),
});
define({
  id: "bread_dough",
  name: "Bread dough",
  examine: "Some uncooked dough.",
  value: 12,
  icon: doughIcon(),
  cook: { into: "bread", level: 1, xp: 40, burnt: "burnt_bread" },
});
define({
  id: "burnt_bread",
  name: "Burnt bread",
  examine: "Yuck, I don't want to eat that.",
  value: 1,
  icon: breadIcon().map((shape) =>
    shape.kind === "poly" ? { ...shape, fill: "#3a2c22" } : shape,
  ),
});

/* Tutorial Island kit and the runes the Magic instructor hands out. */

define({
  id: "bronze_longsword",
  name: "Bronze longsword",
  examine: "A longer sword, with a longer reach.",
  value: 40,
  icon: longswordIcon("#a97142", "#cd9560"),
  equip: {
    slot: "weapon",
    colour: "#a97142",
    requires: { skill: "attack", level: 1 },
    bonus: { aim: 6, power: 8 },
  },
});
define({
  id: "wooden_shield",
  name: "Wooden shield",
  examine: "A shield made from wood. It is better than nothing.",
  value: 20,
  icon: shieldWoodIcon(),
  equip: { slot: "shield", colour: "#8a6136", bonus: { armour: 3 } },
});
define({
  id: "raw_rat_meat",
  name: "Raw rat meat",
  examine: "I need to cook this first.",
  value: 1,
  icon: meatIcon(true),
  cook: { into: "cooked_meat", level: 1, xp: 30, burnt: "burnt_meat" },
});
define({
  id: "cooked_meat",
  name: "Cooked meat",
  examine: "It looks tasty.",
  value: 4,
  icon: meatIcon(false),
  heals: 3,
});
define({
  id: "burnt_meat",
  name: "Burnt meat",
  examine: "Yuck, I don't want to eat that.",
  value: 1,
  icon: meatIcon(false).map((shape) =>
    shape.kind === "poly" ? { ...shape, fill: "#3a2c22" } : shape,
  ),
});
define({
  id: "sleeping_bag",
  name: "Sleeping bag",
  examine: "Zzzzzz. Use it to sleep anywhere.",
  value: 20,
  icon: sleepingBagIcon(),
});

const RUNES: {
  id: string;
  name: string;
  face: string;
  rim: string;
  value: number;
}[] = [
  { id: "air", name: "Air", face: "#dfe6ef", rim: "#98a4b4", value: 4 },
  { id: "mind", name: "Mind", face: "#cf6a5a", rim: "#8f4034", value: 5 },
  { id: "water", name: "Water", face: "#5a8fcf", rim: "#34588f", value: 6 },
  { id: "earth", name: "Earth", face: "#8a6a3c", rim: "#5b4426", value: 6 },
  { id: "fire", name: "Fire", face: "#e08a4a", rim: "#9a5426", value: 6 },
  { id: "body", name: "Body", face: "#b48fcf", rim: "#75588f", value: 6 },
];

for (const rune of RUNES) {
  define({
    id: `${rune.id}_rune`,
    name: `${rune.name} rune`,
    examine: "One of the basic elemental runes.",
    value: rune.value,
    stackable: true,
    icon: runeIcon(rune.face, rune.rim),
  });
}

define({
  id: "amulet_of_strength",
  name: "Amulet of strength",
  examine: "It makes you feel stronger.",
  value: 800,
  icon: [
    { kind: "circle", cx: 16, cy: 18, r: 8, fill: "#c9a227" },
    { kind: "circle", cx: 16, cy: 18, r: 4, fill: "#e33b3b" },
    { kind: "rect", x: 15, y: 4, w: 2, h: 8, fill: "#c9a227" },
  ],
  equip: { slot: "amulet", colour: "#c9a227", bonus: { power: 10 } },
});
define({
  id: "cape_of_legends",
  name: "Cape of legends",
  examine: "Only the truly heroic may wear this.",
  value: 650,
  icon: [
    { kind: "poly", points: "8,4 24,4 28,28 16,24 4,28", fill: "#b02c2c" },
    { kind: "poly", points: "8,4 16,4 16,24 4,28", fill: "#d24545" },
  ],
  equip: { slot: "cape", colour: "#b02c2c", bonus: { armour: 6, prayer: 2 } },
});

export const ITEMS: Record<string, ItemDef> = Object.fromEntries(
  defs.map((def) => [def.id, def]),
);

export function getItem(id: string): ItemDef {
  const def = ITEMS[id];
  if (!def) throw new Error(`Unknown item: ${id}`);
  return def;
}

export function itemName(id: string): string {
  return ITEMS[id]?.name ?? id;
}

export const EMPTY_BONUS: Bonus = {
  aim: 0,
  power: 0,
  armour: 0,
  magic: 0,
  prayer: 0,
};

export function addBonus(total: Bonus, add: Partial<Bonus>): Bonus {
  return {
    aim: total.aim + (add.aim ?? 0),
    power: total.power + (add.power ?? 0),
    armour: total.armour + (add.armour ?? 0),
    magic: total.magic + (add.magic ?? 0),
    prayer: total.prayer + (add.prayer ?? 0),
  };
}

function lighten(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (shift: number) =>
    Math.min(255, Math.round(((n >> shift) & 0xff) * 0.7 + 255 * 0.3));
  return `#${((mix(16) << 16) | (mix(8) << 8) | mix(0)).toString(16).padStart(6, "0")}`;
}
