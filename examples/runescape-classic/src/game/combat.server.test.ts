import {
  type Fighter,
  hitChance,
  HITPOINTS_XP_PER_DAMAGE,
  maxHit,
  meleeXpSplit,
  rollDamage,
  STYLE_BONUSES,
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

test("max hit matches the published numbers", () => {
  // Bare fists at level 1.
  expect(maxHit(fighter())).toBe(1);
  // 99 strength, aggressive, with a weapon of each strength bonus the wiki
  // quotes: a dragon scimitar hits 22 and an abyssal whip 25.
  const at99 = (power: number) =>
    maxHit(fighter({ strength: 99, power, style: STYLE_BONUSES.aggressive }));
  expect(at99(66)).toBe(22);
  expect(at99(82)).toBe(25);
  // The aggressive style is worth three invisible strength levels.
  expect(at99(82)).toBeGreaterThan(
    maxHit(fighter({ strength: 99, power: 82 })),
  );
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

test("a landed blow rolls anywhere from zero to the max hit", () => {
  const rng = mulberry32(3);
  const attacker = fighter({ attack: 30, strength: 30, aim: 20, power: 20 });
  const defender = fighter({ defence: 10, armour: 10 });
  const cap = maxHit(attacker);
  const seen = new Set<number>();
  for (let i = 0; i < 4000; i++) {
    const damage = rollDamage(attacker, defender, rng);
    expect(damage).toBeGreaterThanOrEqual(0);
    expect(damage).toBeLessThanOrEqual(cap);
    seen.add(damage);
  }
  expect(seen.has(0)).toBe(true);
  expect(seen.has(cap)).toBe(true);
});

test("experience is four points per damage, split by style", () => {
  expect(meleeXpSplit("accurate", 5)).toEqual({ attack: 20 });
  expect(meleeXpSplit("aggressive", 5)).toEqual({ strength: 20 });
  expect(meleeXpSplit("defensive", 5)).toEqual({ defence: 20 });
  const shared = meleeXpSplit("controlled", 3);
  expect(shared).toEqual({ attack: 4, strength: 4, defence: 4 });
  expect(HITPOINTS_XP_PER_DAMAGE * 3).toBeCloseTo(4);
});
