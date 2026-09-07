import {
  combatLevel,
  createSkills,
  levelForXp,
  levelProgress,
  MAX_LEVEL,
  SKILL_IDS,
  xpForLevel,
} from "./skills";

test("experience curve matches the published table", () => {
  expect(xpForLevel(1)).toBe(0);
  expect(xpForLevel(2)).toBe(83);
  expect(xpForLevel(10)).toBe(1154);
  expect(xpForLevel(50)).toBe(101_333);
  expect(xpForLevel(MAX_LEVEL)).toBe(13_034_431);
});

test("levelForXp is the inverse of xpForLevel", () => {
  for (let level = 1; level <= MAX_LEVEL; level++) {
    expect(levelForXp(xpForLevel(level))).toBe(level);
    if (level > 1) expect(levelForXp(xpForLevel(level) - 1)).toBe(level - 1);
  }
});

test("level progress runs from 0 to 1 within a level", () => {
  expect(levelProgress(xpForLevel(5))).toBe(0);
  expect(levelProgress(xpForLevel(MAX_LEVEL))).toBe(1);
  const half = (xpForLevel(5) + xpForLevel(6)) / 2;
  expect(levelProgress(half)).toBeCloseTo(0.5, 5);
});

test("combat level starts at 3 and caps at 126", () => {
  const fresh = {
    attack: 1,
    defence: 1,
    strength: 1,
    hitpoints: 10,
    ranged: 1,
    prayer: 1,
    magic: 1,
  };
  expect(combatLevel(fresh as never)).toBe(3);

  const maxed = Object.fromEntries(SKILL_IDS.map((id) => [id, MAX_LEVEL]));
  expect(combatLevel(maxed as never)).toBe(126);
});

test("a pure ranged character is levelled off ranged, not melee", () => {
  const ranger = {
    attack: 1,
    defence: 1,
    strength: 1,
    hitpoints: 10,
    ranged: 50,
    prayer: 1,
    magic: 1,
  };
  expect(combatLevel(ranger as never)).toBe(27);
});

test("a new character has 10 hitpoints and level 1 everywhere else", () => {
  const skills = createSkills();
  expect(skills.current.hitpoints).toBe(10);
  expect(skills.current.attack).toBe(1);
  expect(skills.xp.hitpoints).toBe(xpForLevel(10));
  expect(SKILL_IDS).toHaveLength(20);
});
