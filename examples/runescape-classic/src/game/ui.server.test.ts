import { xpForLevel } from "./skills";
import { addItem, countItem, findSlot } from "./state";
import { advanceUntil, createMainlandEngine } from "./test-helpers";
import { buildUi, initialUi } from "./ui";

function snapshot(engine: ReturnType<typeof createMainlandEngine>) {
  return buildUi({
    player: engine.state.player,
    messages: engine.state.messages,
    overlay: engine.state.overlay,
    region: engine.region,
    shop: engine.openShop,
  });
}

test("the server render snapshot describes a brand new character", () => {
  const ui = initialUi();
  expect(ui.combatLevel).toBe(3);
  expect(ui.hitpoints).toBe(10);
  expect(ui.totalLevel).toBe(29);
  expect(ui.skills).toHaveLength(20);
  expect(ui.inventory).toHaveLength(30);
  expect(ui.freeSlots).toBe(30);
  expect(ui.coins).toBe(0);
  expect(ui.region).toBe("Tutorial Island");
});

test("equipping a weapon shows up in the snapshot bonuses", () => {
  const engine = createMainlandEngine();
  engine.addXp("strength", xpForLevel(40));
  addItem(engine.state.player.inventory, "iron_sword");
  engine.inventoryAction(
    findSlot(engine.state.player.inventory, "iron_sword"),
    "equip",
  );

  const ui = snapshot(engine);
  expect(ui.equipment.find((slot) => slot.slot === "weapon")?.item?.name).toBe(
    "Iron sword",
  );
  expect(ui.bonus.aim).toBe(12);
  expect(ui.bonus.power).toBe(12);
  expect(ui.maxHit).toBe(6);
});

test("gaining experience moves the level and its progress bar", () => {
  const engine = createMainlandEngine();
  engine.addXp("woodcutting", 100);

  const skill = snapshot(engine).skills.find(
    (entry) => entry.id === "woodcutting",
  )!;
  expect(skill.base).toBe(2);
  expect(skill.xp).toBe(100);
  expect(skill.progress).toBeGreaterThan(0);
  expect(skill.progress).toBeLessThan(1);
  expect(skill.toNextLevel).toBe(74);
});

test("the shop snapshot names the counter's own shop and prices its stock", () => {
  const engine = createMainlandEngine();
  const counter = engine.state.map.objects.find(
    (object) => object?.defId === "shop_counter" && object.shopId === "general",
  )!;
  engine.choose({
    label: "",
    verb: "Trade at",
    action: "shop",
    target: { kind: "object", index: counter.index },
  });
  advanceUntil(engine, () => engine.state.overlay.kind === "shop");

  const ui = snapshot(engine);
  expect(ui.overlay).toBe("shop");
  expect(ui.shopName).toBe("General Store");
  const bread = ui.shop.find((entry) => entry.id === "bread")!;
  expect(bread.price).toBeGreaterThan(12);
  expect(bread.count).toBe(20);
  expect(ui.coins).toBe(countItem(engine.state.player.inventory, "coins"));
});
