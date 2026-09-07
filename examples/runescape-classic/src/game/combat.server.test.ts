import {
  combatXp,
  type Fighter,
  hitChance,
  maxHit,
  rollDamage,
} from "./combat";
import { mulberry32 } from "./rng";

const fighter = (overrides: Partial<Fighter> = {}): Fighter => ({
  attack: 1,
  strength: 1,
  defence: 1,
  aim: 0,
  power: 0,
  armour: 0,
  ...overrides,
});

test("max hit grows with strength and weapon power", () => {
  expect(maxHit(1, 0)).toBe(1);
  expect(maxHit(10, 0)).toBe(1);
  expect(maxHit(99, 0)).toBe(10);
  expect(maxHit(99, 47)).toBe(17);
  expect(maxHit(99, 0)).toBeLessThan(maxHit(99, 30));
});

test("accuracy rises with attack and falls with the target's armour", () => {
  const attacker = fighter({ attack: 40, aim: 30 });
  const weak = fighter({ defence: 1 });
  const armoured = fighter({ defence: 40, armour: 60 });
  expect(hitChance(attacker, weak)).toBeGreaterThan(
    hitChance(attacker, armoured),
  );
  expect(hitChance(attacker, weak)).toBeLessThanOrEqual(1);
  expect(hitChance(fighter(), armoured)).toBeGreaterThan(0);
});

test("damage never exceeds the max hit and zero means a block", () => {
  const rng = mulberry32(3);
  const attacker = fighter({ attack: 30, strength: 30, aim: 20, power: 20 });
  const defender = fighter({ defence: 10, armour: 10 });
  const cap = maxHit(attacker.strength, attacker.power);
  let landed = 0;
  for (let i = 0; i < 2000; i++) {
    const damage = rollDamage(attacker, defender, rng);
    expect(damage).toBeGreaterThanOrEqual(0);
    expect(damage).toBeLessThanOrEqual(cap);
    if (damage > 0) landed++;
  }
  expect(landed).toBeGreaterThan(0);
  expect(landed).toBeLessThan(2000);
});

test("experience is four times the damage dealt", () => {
  expect(combatXp(5)).toBe(20);
});
