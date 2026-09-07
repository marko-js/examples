import { applySave, type SaveData } from "./save";
import { baseLevel, xpForLevel } from "./skills";
import { addItem, createPlayer } from "./state";

test("a save restores position, experience, carried items and equipment", () => {
  const original = createPlayer();
  original.x = 40;
  original.y = 55;
  original.skills.xp.woodcut = xpForLevel(30);
  original.equipment.weapon = "bronze_axe";
  addItem(original.inventory, "logs", 4);

  const data: SaveData = {
    version: 1,
    name: "Ada",
    x: original.x,
    y: original.y,
    hits: 7,
    xp: { woodcut: original.skills.xp.woodcut, hits: xpForLevel(20) },
    inventory: original.inventory,
    equipment: original.equipment,
    bank: [{ id: "coins", count: 900 }],
    combatStyle: "aggressive",
  };

  const restored = createPlayer();
  applySave(restored, data);

  expect(restored.name).toBe("Ada");
  expect({ x: restored.x, y: restored.y }).toEqual({ x: 40, y: 55 });
  expect(baseLevel(restored.skills, "woodcut")).toBe(30);
  expect(restored.maxHits).toBe(20);
  expect(restored.hits).toBe(7);
  expect(restored.equipment.weapon).toBe("bronze_axe");
  expect(restored.bank).toEqual([{ id: "coins", count: 900 }]);
});

test("hits are clamped to the level they belong to", () => {
  const player = createPlayer();
  applySave(player, {
    version: 1,
    name: "Ada",
    x: 1,
    y: 1,
    hits: 999,
    xp: {},
    inventory: player.inventory,
    equipment: {},
    bank: [],
    combatStyle: "controlled",
  });
  expect(player.hits).toBe(10);
});
