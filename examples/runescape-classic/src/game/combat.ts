/**
 * The RuneScape 2 combat maths as published: effective levels feed an attack
 * roll and a defence roll that decide whether a blow lands, and the strength
 * formula caps how hard it lands.
 *
 * https://oldschool.runescape.wiki/w/Damage_per_second/Melee
 */
import type { Rng } from "./rng";
import type { SkillId } from "./skills";
import type { CombatStyle } from "./state";

/** Invisible levels an attack style adds while it is selected. */
export interface StyleBonus {
  attack: number;
  strength: number;
  defence: number;
}

export const STYLE_BONUSES: Record<CombatStyle, StyleBonus> = {
  accurate: { attack: 3, strength: 0, defence: 0 },
  aggressive: { attack: 0, strength: 3, defence: 0 },
  defensive: { attack: 0, strength: 0, defence: 3 },
  controlled: { attack: 1, strength: 1, defence: 1 },
};

/** Monsters carry one invisible level on attack and strength instead. */
export const MONSTER_STYLE: StyleBonus = {
  attack: 1,
  strength: 1,
  defence: 0,
};

const NO_STYLE: StyleBonus = { attack: 0, strength: 0, defence: 0 };

export interface Fighter {
  attack: number;
  strength: number;
  defence: number;
  /** Equipment attack bonus. */
  aim: number;
  /** Equipment strength bonus. */
  power: number;
  /** Equipment defence bonus. */
  armour: number;
  style?: StyleBonus;
}

/** A level plus its style bonus and the flat +8 every combat roll carries. */
function effective(level: number, bonus: number): number {
  return level + bonus + 8;
}

/**
 * Highest damage a fighter can deal in one blow. The floor of one stands in
 * for the hand-set max hits the game gives monsters whose bonuses are so
 * negative the formula would leave them harmless.
 */
export function maxHit(fighter: Fighter): number {
  const style = fighter.style ?? NO_STYLE;
  const strength = effective(fighter.strength, style.strength);
  return Math.max(1, Math.floor((strength * (fighter.power + 64) + 320) / 640));
}

export function attackRoll(fighter: Fighter): number {
  const style = fighter.style ?? NO_STYLE;
  return effective(fighter.attack, style.attack) * (fighter.aim + 64);
}

/** Defence carries +9 rather than +8, which is where the extra tenth of a percent goes. */
export function defenceRoll(fighter: Fighter): number {
  const style = fighter.style ?? NO_STYLE;
  return (fighter.defence + style.defence + 9) * (fighter.armour + 64);
}

/** Probability that an attack lands, between 0 and 1. */
export function hitChance(attacker: Fighter, defender: Fighter): number {
  const attack = attackRoll(attacker);
  const defence = defenceRoll(defender);
  return attack > defence
    ? 1 - (defence + 2) / (2 * (attack + 1))
    : attack / (2 * (defence + 1));
}

/**
 * Damage for a single blow. A blow that beats the defence roll still rolls
 * anywhere from zero to the max hit, which is why the game shows blue zeroes.
 */
export function rollDamage(
  attacker: Fighter,
  defender: Fighter,
  rng: Rng,
): number {
  if (rng() > hitChance(attacker, defender)) return 0;
  return Math.floor(rng() * (maxHit(attacker) + 1));
}

/** Experience per point of damage dealt, before it is split by style. */
export const XP_PER_DAMAGE = 4;

/** Every point of damage also pays a third of that into Hitpoints. */
export const HITPOINTS_XP_PER_DAMAGE = 4 / 3;

/**
 * Where a melee style sends its experience. Controlled splits the four points
 * three ways; the rest put all four into one skill.
 */
export function meleeXpSplit(
  style: CombatStyle,
  damage: number,
): Partial<Record<SkillId, number>> {
  const total = damage * XP_PER_DAMAGE;
  switch (style) {
    case "accurate":
      return { attack: total };
    case "aggressive":
      return { strength: total };
    case "defensive":
      return { defence: total };
    default:
      return {
        attack: total / 3,
        strength: total / 3,
        defence: total / 3,
      };
  }
}
