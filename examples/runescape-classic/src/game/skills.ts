/** Skill definitions, the experience curve, and level derived stats. */

export const SKILL_IDS = [
  "attack",
  "hitpoints",
  "mining",
  "strength",
  "agility",
  "smithing",
  "defence",
  "herblore",
  "fishing",
  "ranged",
  "thieving",
  "cooking",
  "prayer",
  "crafting",
  "firemaking",
  "magic",
  "fletching",
  "woodcutting",
  "runecraft",
  "slayer",
] as const;

export type SkillId = (typeof SKILL_IDS)[number];

export const SKILL_NAMES: Record<SkillId, string> = {
  attack: "Attack",
  hitpoints: "Hitpoints",
  mining: "Mining",
  strength: "Strength",
  agility: "Agility",
  smithing: "Smithing",
  defence: "Defence",
  herblore: "Herblore",
  fishing: "Fishing",
  ranged: "Ranged",
  thieving: "Thieving",
  cooking: "Cooking",
  prayer: "Prayer",
  crafting: "Crafting",
  firemaking: "Firemaking",
  magic: "Magic",
  fletching: "Fletching",
  woodcutting: "Woodcutting",
  runecraft: "Runecraft",
  slayer: "Slayer",
};

export const MAX_LEVEL = 99;

/** Levels a fresh character starts with. Everything else starts at 1. */
export const STARTING_LEVELS: Partial<Record<SkillId, number>> = {
  hitpoints: 10,
};

export interface Skills {
  /** Total experience earned per skill. */
  xp: Record<SkillId, number>;
  /** Working level, which drain and boosts move away from the base level. */
  current: Record<SkillId, number>;
}

const XP_TABLE = buildXpTable();

export function createSkills(): Skills {
  const xp = {} as Record<SkillId, number>;
  const current = {} as Record<SkillId, number>;
  for (const id of SKILL_IDS) {
    const level = STARTING_LEVELS[id] ?? 1;
    xp[id] = xpForLevel(level);
    current[id] = level;
  }
  return { xp, current };
}

/** Total experience needed to reach `level`. */
export function xpForLevel(level: number): number {
  return XP_TABLE[clampLevel(level) - 1];
}

/** Highest level fully paid for by `xp`. */
export function levelForXp(xp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && XP_TABLE[level] <= xp) level++;
  return level;
}

export function baseLevel(skills: Skills, id: SkillId): number {
  return levelForXp(skills.xp[id]);
}

/** How far through the current level `xp` is, from 0 to 1. */
export function levelProgress(xp: number): number {
  const level = levelForXp(xp);
  if (level >= MAX_LEVEL) return 1;
  const start = xpForLevel(level);
  const end = xpForLevel(level + 1);
  return (xp - start) / (end - start);
}

/**
 * RuneScape 2 combat level: a base from the defensive skills, plus whichever
 * of melee, ranged or magic you have invested in most. Runs from 3 to 126.
 */
export function combatLevel(levels: Record<SkillId, number>): number {
  const base =
    0.25 * (levels.defence + levels.hitpoints + Math.floor(levels.prayer / 2));
  const melee = 0.325 * (levels.attack + levels.strength);
  const ranged = 0.325 * Math.floor(levels.ranged * 1.5);
  const magic = 0.325 * Math.floor(levels.magic * 1.5);
  return Math.floor(base + Math.max(melee, ranged, magic));
}

export function baseLevels(skills: Skills): Record<SkillId, number> {
  const levels = {} as Record<SkillId, number>;
  for (const id of SKILL_IDS) levels[id] = baseLevel(skills, id);
  return levels;
}

function buildXpTable(): number[] {
  const table: number[] = [];
  let points = 0;
  for (let level = 1; level <= MAX_LEVEL; level++) {
    table.push(Math.floor(points / 4));
    points += Math.floor(level + 300 * Math.pow(2, level / 7));
  }
  return table;
}

function clampLevel(level: number): number {
  return Math.min(MAX_LEVEL, Math.max(1, Math.floor(level)));
}
