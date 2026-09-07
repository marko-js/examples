/** The free-to-play strike spells, and what it takes to cast them. */
import type { Rng } from "./rng";

export interface RuneCost {
  id: string;
  count: number;
}

export interface Spell {
  id: string;
  name: string;
  level: number;
  /** Experience for a cast that lands. A splash gives half. */
  xp: number;
  maxHit: number;
  runes: RuneCost[];
}

export const SPELLS: Spell[] = [
  {
    id: "wind_strike",
    name: "Wind strike",
    level: 1,
    xp: 6,
    maxHit: 1,
    runes: [
      { id: "air_rune", count: 1 },
      { id: "mind_rune", count: 1 },
    ],
  },
  {
    id: "water_strike",
    name: "Water strike",
    level: 5,
    xp: 10,
    maxHit: 2,
    runes: [
      { id: "water_rune", count: 1 },
      { id: "air_rune", count: 1 },
      { id: "mind_rune", count: 1 },
    ],
  },
  {
    id: "earth_strike",
    name: "Earth strike",
    level: 9,
    xp: 14,
    maxHit: 3,
    runes: [
      { id: "earth_rune", count: 2 },
      { id: "air_rune", count: 1 },
      { id: "mind_rune", count: 1 },
    ],
  },
  {
    id: "fire_strike",
    name: "Fire strike",
    level: 13,
    xp: 18,
    maxHit: 4,
    runes: [
      { id: "fire_rune", count: 3 },
      { id: "air_rune", count: 2 },
      { id: "mind_rune", count: 1 },
    ],
  },
];

export function getSpell(id: string): Spell {
  const spell = SPELLS.find((entry) => entry.id === id);
  if (!spell) throw new Error(`Unknown spell: ${id}`);
  return spell;
}

/** Chance a cast lands rather than splashing. */
export function castChance(magicLevel: number, spell: Spell): number {
  return Math.min(
    0.95,
    Math.max(0.3, 0.55 + (magicLevel - spell.level) * 0.02),
  );
}

/** Damage for one cast. Zero means the spell splashed. */
export function rollSpellDamage(
  magicLevel: number,
  spell: Spell,
  rng: Rng,
): number {
  if (rng() > castChance(magicLevel, spell)) return 0;
  return 1 + Math.floor(rng() * spell.maxHit);
}
