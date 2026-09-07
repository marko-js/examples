/**
 * Damage rolls. Max hitpoints follow the RuneScape Classic strength formula while
 * accuracy uses the familiar attack roll versus defence roll comparison.
 */
import type { Rng } from "./rng";

export interface Fighter {
  attack: number;
  strength: number;
  defence: number;
  aim: number;
  power: number;
  armour: number;
}

/** Highest damage a fighter can deal in one blow, never below one. */
export function maxHit(strength: number, power: number): number {
  return Math.max(1, Math.floor((strength * (power + 64) + 320) / 640));
}

/** Probability that an attack lands, between 0 and 1. */
export function hitChance(attacker: Fighter, defender: Fighter): number {
  const attackRoll = (attacker.attack + 8) * (attacker.aim + 64);
  const defenceRoll = (defender.defence + 8) * (defender.armour + 64);
  return attackRoll > defenceRoll
    ? 1 - (defenceRoll + 2) / (2 * (attackRoll + 1))
    : attackRoll / (2 * (defenceRoll + 1));
}

/** Damage for a single blow. Zero means the attack was blocked. */
export function rollDamage(
  attacker: Fighter,
  defender: Fighter,
  rng: Rng,
): number {
  if (rng() > hitChance(attacker, defender)) return 0;
  return 1 + Math.floor(rng() * maxHit(attacker.strength, attacker.power));
}

/** Experience awarded for dealing `damage`, split the way Classic split it. */
export function combatXp(damage: number): number {
  return damage * 4;
}
