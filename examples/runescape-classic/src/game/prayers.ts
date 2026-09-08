/**
 * The standard prayer book, as free players had it. Levels, drain rates and
 * boosts are the published ones.
 *
 * https://oldschool.runescape.wiki/w/Prayer
 */
import type { SkillId } from "./skills";

/** Prayers in the same group turn each other off. */
export type PrayerGroup =
  | "attack"
  | "strength"
  | "defence"
  | "ranged"
  | "magic"
  | "restore"
  | "heal"
  | "item"
  | "overhead";

export interface PrayerDef {
  id: string;
  name: string;
  level: number;
  group: PrayerGroup;
  /** Seconds of praying per point of prayer spent. */
  seconds: number;
  /** Share added to the skill while it burns, so 0.05 is the +5% ones. */
  boost?: { skill: SkillId; share: number };
  /** The attack style this turns aside, for the overhead prayers. */
  protect?: "melee" | "missiles" | "magic";
  blurb: string;
}

export const PRAYERS: PrayerDef[] = [
  {
    id: "thick_skin",
    name: "Thick Skin",
    level: 1,
    group: "defence",
    seconds: 36,
    boost: { skill: "defence", share: 0.05 },
    blurb: "+5% Defence",
  },
  {
    id: "burst_of_strength",
    name: "Burst of Strength",
    level: 4,
    group: "strength",
    seconds: 36,
    boost: { skill: "strength", share: 0.05 },
    blurb: "+5% Strength",
  },
  {
    id: "clarity_of_thought",
    name: "Clarity of Thought",
    level: 7,
    group: "attack",
    seconds: 36,
    boost: { skill: "attack", share: 0.05 },
    blurb: "+5% Attack",
  },
  {
    id: "sharp_eye",
    name: "Sharp Eye",
    level: 8,
    group: "ranged",
    seconds: 36,
    boost: { skill: "ranged", share: 0.05 },
    blurb: "+5% Ranged",
  },
  {
    id: "mystic_will",
    name: "Mystic Will",
    level: 9,
    group: "magic",
    seconds: 36,
    boost: { skill: "magic", share: 0.05 },
    blurb: "+5% Magic",
  },
  {
    id: "rock_skin",
    name: "Rock Skin",
    level: 10,
    group: "defence",
    seconds: 6,
    boost: { skill: "defence", share: 0.1 },
    blurb: "+10% Defence",
  },
  {
    id: "superhuman_strength",
    name: "Superhuman Strength",
    level: 13,
    group: "strength",
    seconds: 6,
    boost: { skill: "strength", share: 0.1 },
    blurb: "+10% Strength",
  },
  {
    id: "improved_reflexes",
    name: "Improved Reflexes",
    level: 16,
    group: "attack",
    seconds: 6,
    boost: { skill: "attack", share: 0.1 },
    blurb: "+10% Attack",
  },
  {
    id: "rapid_restore",
    name: "Rapid Restore",
    level: 19,
    group: "restore",
    seconds: 36,
    blurb: "Skills return twice as fast",
  },
  {
    id: "rapid_heal",
    name: "Rapid Heal",
    level: 22,
    group: "heal",
    seconds: 18,
    blurb: "Hitpoints return twice as fast",
  },
  {
    id: "protect_item",
    name: "Protect Item",
    level: 25,
    group: "item",
    seconds: 18,
    blurb: "Keep one more item on death",
  },
  {
    id: "hawk_eye",
    name: "Hawk Eye",
    level: 26,
    group: "ranged",
    seconds: 6,
    boost: { skill: "ranged", share: 0.1 },
    blurb: "+10% Ranged",
  },
  {
    id: "mystic_lore",
    name: "Mystic Lore",
    level: 27,
    group: "magic",
    seconds: 6,
    boost: { skill: "magic", share: 0.1 },
    blurb: "+10% Magic",
  },
  {
    id: "steel_skin",
    name: "Steel Skin",
    level: 28,
    group: "defence",
    seconds: 3,
    boost: { skill: "defence", share: 0.15 },
    blurb: "+15% Defence",
  },
  {
    id: "ultimate_strength",
    name: "Ultimate Strength",
    level: 31,
    group: "strength",
    seconds: 3,
    boost: { skill: "strength", share: 0.15 },
    blurb: "+15% Strength",
  },
  {
    id: "incredible_reflexes",
    name: "Incredible Reflexes",
    level: 34,
    group: "attack",
    seconds: 3,
    boost: { skill: "attack", share: 0.15 },
    blurb: "+15% Attack",
  },
  {
    id: "protect_from_magic",
    name: "Protect from Magic",
    level: 37,
    group: "overhead",
    seconds: 3,
    protect: "magic",
    blurb: "Turns aside magic",
  },
  {
    id: "protect_from_missiles",
    name: "Protect from Missiles",
    level: 40,
    group: "overhead",
    seconds: 3,
    protect: "missiles",
    blurb: "Turns aside arrows",
  },
  {
    id: "protect_from_melee",
    name: "Protect from Melee",
    level: 43,
    group: "overhead",
    seconds: 3,
    protect: "melee",
    blurb: "Turns aside blades",
  },
  {
    id: "eagle_eye",
    name: "Eagle Eye",
    level: 44,
    group: "ranged",
    seconds: 3,
    boost: { skill: "ranged", share: 0.15 },
    blurb: "+15% Ranged",
  },
  {
    id: "mystic_might",
    name: "Mystic Might",
    level: 45,
    group: "magic",
    seconds: 3,
    boost: { skill: "magic", share: 0.15 },
    blurb: "+15% Magic",
  },
];

const BY_ID = new Map(PRAYERS.map((prayer) => [prayer.id, prayer]));

export function getPrayer(id: string): PrayerDef {
  const prayer = BY_ID.get(id);
  if (!prayer) throw new Error(`Unknown prayer: ${id}`);
  return prayer;
}

/**
 * Groups that cannot burn together. Melee's attack and strength stack with
 * each other and with defence, but a ranged or magic prayer replaces them.
 */
const RIVALS: Partial<Record<PrayerGroup, PrayerGroup[]>> = {
  attack: ["ranged", "magic"],
  strength: ["ranged", "magic"],
  ranged: ["attack", "strength", "magic"],
  magic: ["attack", "strength", "ranged"],
};

/** Whether lighting `next` should put `active` out. */
export function conflicts(next: PrayerDef, active: PrayerDef): boolean {
  if (next.id === active.id) return false;
  return (
    next.group === active.group ||
    (RIVALS[next.group]?.includes(active.group) ?? false)
  );
}

/** Points burnt per second by everything currently lit. */
export function drainRate(active: readonly string[]): number {
  return active.reduce((rate, id) => rate + 1 / getPrayer(id).seconds, 0);
}
