/**
 * The published numbers the game is built from. These are transcribed from the
 * skill and monster tables, so a change here is a change to the game's fidelity
 * rather than a refactor.
 */
import { getItem, SMELT_XP, SMITH_XP } from "./items";
import { getNpcDef, npcCombatLevel } from "./npcs";
import { combatLevel, type SkillId } from "./skills";
import { getObjectDef } from "./world";

test("gathering pays the experience the skill tables list", () => {
  const gathered = (id: string) => getObjectDef(id).gather?.xp;

  // Woodcutting.
  expect(gathered("tree")).toBe(25);
  expect(gathered("oak")).toBe(37.5);
  expect(gathered("willow")).toBe(67.5);
  expect(gathered("maple")).toBe(100);

  // Mining.
  expect(gathered("rock_copper")).toBe(17.5);
  expect(gathered("rock_tin")).toBe(17.5);
  expect(gathered("rock_iron")).toBe(35);
  expect(gathered("rock_coal")).toBe(50);
  expect(gathered("rock_gold")).toBe(65);
  expect(gathered("rock_mithril")).toBe(80);

  // Fishing, which pays much less than cooking the same fish.
  expect(gathered("fish_net")).toBe(10);
  expect(gathered("fish_bait")).toBe(20);
  expect(gathered("fish_lure")).toBe(50);
  expect(gathered("fish_salmon")).toBe(70);
  expect(gathered("fish_cage")).toBe(90);
});

test("cooking, firemaking, prayer and smithing pay their listed rates", () => {
  expect(getItem("raw_shrimp").cook).toMatchObject({ xp: 30, level: 1 });
  expect(getItem("raw_trout").cook).toMatchObject({ xp: 70, level: 15 });
  expect(getItem("raw_lobster").cook).toMatchObject({ xp: 120, level: 40 });
  expect(getItem("bread_dough").cook).toMatchObject({ xp: 40 });

  expect(getItem("logs").burnXp).toBe(40);
  expect(getItem("oak_logs").burnXp).toBe(60);
  expect(getItem("willow_logs").burnXp).toBe(90);

  expect(getItem("bones").buryXp).toBe(4.5);
  expect(getItem("big_bones").buryXp).toBe(15);

  expect(SMELT_XP.bronze).toBe(6.2);
  expect(SMITH_XP.bronze).toBe(12.5);
  expect(getItem("bronze_bar").smith?.xp).toBe(12.5);
});

test("cooked food heals what the tables say", () => {
  expect(getItem("shrimp").heals).toBe(3);
  expect(getItem("trout").heals).toBe(7);
  expect(getItem("salmon").heals).toBe(9);
  expect(getItem("lobster").heals).toBe(12);
  expect(getItem("bread").heals).toBe(5);
});

test("monsters carry their published levels and combat levels", () => {
  const stats = {
    chicken: { attack: 1, strength: 1, defence: 1, hitpoints: 3, combat: 1 },
    rat: { attack: 1, strength: 1, defence: 1, hitpoints: 2, combat: 1 },
    giant_rat: { attack: 2, strength: 3, defence: 2, hitpoints: 5, combat: 3 },
    cow: { attack: 1, strength: 1, defence: 1, hitpoints: 8, combat: 2 },
    goblin: { attack: 1, strength: 1, defence: 1, hitpoints: 5, combat: 2 },
    man: { attack: 1, strength: 1, defence: 1, hitpoints: 7, combat: 2 },
    guard: { attack: 19, strength: 18, defence: 14, hitpoints: 22, combat: 21 },
    skeleton: {
      attack: 15,
      strength: 18,
      defence: 17,
      hitpoints: 29,
      combat: 22,
    },
    hobgoblin: {
      attack: 22,
      strength: 24,
      defence: 24,
      hitpoints: 29,
      combat: 28,
    },
    white_knight: {
      attack: 27,
      strength: 29,
      defence: 21,
      hitpoints: 52,
      combat: 36,
    },
  };

  for (const [id, { combat, ...levels }] of Object.entries(stats)) {
    const def = getNpcDef(id);
    expect({ id, ...def.levels }).toEqual({ id, ...levels });
    expect(npcCombatLevel(def)).toBe(combat);
    // Everything here is one the player formula also agrees with.
    expect(
      combatLevel({
        ranged: 1,
        prayer: 1,
        magic: 1,
        ...def.levels,
      } as unknown as Record<SkillId, number>),
    ).toBe(combat);
  }
});
