import { RESPAWN_TILE } from "./config";
import { getItem } from "./items";
import { addItem, countItem, findSlot, removeItem } from "./state";
import {
  act,
  advance,
  advanceUntil,
  createMainlandEngine,
  lastMessages,
  lightFire,
  nearestObject,
} from "./test-helpers";
import { objectAt } from "./world";

test("walking moves the player to the tile that was clicked", () => {
  const engine = createMainlandEngine();
  const goal = { x: engine.state.player.x - 4, y: engine.state.player.y + 3 };
  act(engine, "walk", { kind: "tile", ...goal });
  advance(engine, 8000);
  expect({ x: engine.state.player.x, y: engine.state.player.y }).toEqual(goal);
});

test("chopping a tree yields logs, experience, and a stump that regrows", () => {
  const engine = createMainlandEngine();
  const tree = nearestObject(engine, (object) => object.defId === "tree");

  act(engine, "gather", { kind: "object", index: tree.index });
  advanceUntil(
    engine,
    () => countItem(engine.state.player.inventory, "logs") > 0,
  );

  expect(engine.state.player.skills.xp.woodcutting).toBe(25);
  expect(objectAt(engine.state.map, tree.x, tree.y)?.defId).toBe("stump");

  advance(engine, 20_000);
  expect(objectAt(engine.state.map, tree.x, tree.y)?.defId).toBe("tree");
});

test("mining an ore rock trains mining and fills the inventory", () => {
  const engine = createMainlandEngine();
  const rock = nearestObject(
    engine,
    (object) => object.defId === "rock_copper",
  );

  act(engine, "gather", { kind: "object", index: rock.index });
  advanceUntil(
    engine,
    () => countItem(engine.state.player.inventory, "copper_ore") > 0,
  );

  expect(countItem(engine.state.player.inventory, "copper_ore")).toBe(1);
  expect(engine.state.player.skills.xp.mining).toBe(17);
});

test("fishing needs the matching tool", () => {
  const engine = createMainlandEngine();
  const spot = nearestObject(engine, (object) => object.defId === "fish_net");
  removeItem(engine.state.player.inventory, "small_net");

  act(engine, "gather", { kind: "object", index: spot.index });
  advanceUntil(
    engine,
    () => lastMessages(engine, 1)[0] === "You need a net to do that.",
  );

  addItem(engine.state.player.inventory, "small_net");
  act(engine, "gather", { kind: "object", index: spot.index });
  advanceUntil(
    engine,
    () => countItem(engine.state.player.inventory, "raw_shrimp") > 0,
  );
  expect(engine.state.player.skills.xp.fishing).toBe(30);
});

test("a tinderbox and logs light a fire that raw fish can be cooked on", () => {
  const engine = createMainlandEngine();
  const { player } = engine.state;
  addItem(player.inventory, "raw_shrimp");

  const fire = lightFire(engine);
  expect(player.skills.xp.firemaking).toBe(40);
  expect(countItem(player.inventory, "logs")).toBe(0);

  player.selectedSlot = findSlot(player.inventory, "raw_shrimp");
  act(engine, "use", { kind: "object", index: fire.index });
  advance(engine, 600);
  expect(
    countItem(player.inventory, "shrimp") +
      countItem(player.inventory, "burnt_fish"),
  ).toBe(1);
});

test("a fire burns out on its own", () => {
  const engine = createMainlandEngine();
  const { player } = engine.state;
  lightFire(engine);
  expect(objectAt(engine.state.map, player.x, player.y)?.defId).toBe("fire");

  advance(engine, 200 * 600 + 1200);
  expect(objectAt(engine.state.map, player.x, player.y)).toBeUndefined();
});

test("killing a chicken awards combat experience and drops loot", () => {
  const engine = createMainlandEngine();
  const chicken = engine.state.npcs.find((npc) => npc.defId === "chicken")!;

  act(engine, "attack", { kind: "npc", uid: chicken.uid });
  advanceUntil(engine, () => chicken.respawnTick !== null);

  expect(engine.state.player.skills.xp.attack).toBeGreaterThan(0);
  expect(engine.state.player.skills.xp.hitpoints).toBeGreaterThan(1154);
  expect(engine.state.groundItems.map((item) => item.id)).toContain("bones");
});

test("bones can be picked up and buried for prayer experience", () => {
  const engine = createMainlandEngine();
  const chicken = engine.state.npcs.find((npc) => npc.defId === "chicken")!;
  act(engine, "attack", { kind: "npc", uid: chicken.uid });
  advanceUntil(engine, () => chicken.respawnTick !== null);

  const bones = engine.state.groundItems.find((item) => item.id === "bones")!;
  act(engine, "take", { kind: "ground", uid: bones.uid });
  advanceUntil(
    engine,
    () => countItem(engine.state.player.inventory, "bones") === 1,
  );

  engine.inventoryAction(
    findSlot(engine.state.player.inventory, "bones"),
    "bury",
  );
  expect(engine.state.player.skills.xp.prayer).toBe(15);
  expect(countItem(engine.state.player.inventory, "bones")).toBe(0);
});

test("equipment applies its bonuses and enforces level requirements", () => {
  const engine = createMainlandEngine();
  const { player } = engine.state;
  addItem(player.inventory, "bronze_sword");
  addItem(player.inventory, "rune_sword");

  engine.inventoryAction(findSlot(player.inventory, "rune_sword"), "equip");
  expect(player.equipment.weapon).toBeUndefined();
  expect(lastMessages(engine, 1)[0]).toBe(
    "You need Attack level 40 to use that.",
  );

  engine.inventoryAction(findSlot(player.inventory, "bronze_sword"), "equip");
  expect(player.equipment.weapon).toBe("bronze_sword");

  engine.unequip("weapon");
  expect(player.equipment.weapon).toBeUndefined();
  expect(countItem(player.inventory, "bronze_sword")).toBe(1);
});

test("eating restores hitpoints without going over the maximum", () => {
  const engine = createMainlandEngine();
  const { player } = engine.state;
  player.hitpoints = 4;

  engine.inventoryAction(findSlot(player.inventory, "bread"), "eat");
  expect(player.hitpoints).toBe(9);

  engine.inventoryAction(findSlot(player.inventory, "bread"), "eat");
  expect(player.hitpoints).toBe(10);
});

test("the bank stores items and hands them back", () => {
  const engine = createMainlandEngine();
  const chest = nearestObject(
    engine,
    (object) => object.defId === "bank_chest",
  );

  act(engine, "bank", { kind: "object", index: chest.index });
  advanceUntil(engine, () => engine.state.overlay.kind === "bank");

  engine.depositAll("bread");
  expect(engine.state.player.bank).toEqual([{ id: "bread", count: 3 }]);
  expect(countItem(engine.state.player.inventory, "bread")).toBe(0);

  engine.withdraw("bread", 2);
  expect(countItem(engine.state.player.inventory, "bread")).toBe(2);
  expect(engine.state.player.bank).toEqual([{ id: "bread", count: 1 }]);

  engine.closeOverlay();
  expect(engine.state.overlay.kind).toBe("none");
});

test("the general store buys and sells at its own prices", () => {
  const engine = createMainlandEngine();
  const counter = nearestObject(
    engine,
    (object) => object.defId === "shop_counter" && object.shopId === "general",
  );

  act(engine, "shop", { kind: "object", index: counter.index });
  advanceUntil(engine, () => engine.state.overlay.kind === "shop");

  const before = countItem(engine.state.player.inventory, "coins");
  engine.buy("tinderbox");
  const spent = before - countItem(engine.state.player.inventory, "coins");
  expect(spent).toBe(Math.round(getItem("tinderbox").value * 1.15));
  expect(countItem(engine.state.player.inventory, "tinderbox")).toBe(2);

  engine.sell(findSlot(engine.state.player.inventory, "tinderbox"));
  const earned =
    countItem(engine.state.player.inventory, "coins") - (before - spent);
  expect(earned).toBe(Math.floor(getItem("tinderbox").value * 0.4));
  expect(earned).toBeLessThan(spent);
});

test("dying sends the player back to Lumbridge with full hitpoints", () => {
  const engine = createMainlandEngine();
  const { player } = engine.state;
  const hobgoblin = engine.state.npcs.find((npc) => npc.defId === "hobgoblin")!;
  player.x = hobgoblin.x;
  player.y = hobgoblin.y + 1;
  player.fx = player.x;
  player.fy = player.y;

  act(engine, "attack", { kind: "npc", uid: hobgoblin.uid });
  advanceUntil(
    engine,
    () =>
      player.x === RESPAWN_TILE.x &&
      player.y === RESPAWN_TILE.y &&
      player.respawnTick === null,
  );

  expect(player.respawnTick).toBeNull();
  expect(player.hitpoints).toBe(player.maxHitpoints);
  expect({ x: player.x, y: player.y }).toEqual(RESPAWN_TILE);
  expect(engine.state.messages.map((message) => message.text)).toContain(
    "Oh dear, you are dead!",
  );
});

test("menu options describe what is under the pointer", () => {
  const engine = createMainlandEngine();
  const tree = nearestObject(engine, (object) => object.defId === "tree");

  const options = engine.optionsAt(tree.x, tree.y);
  expect(options.map((option) => option.label)).toEqual([
    "Chop Tree",
    "Examine Tree",
  ]);
  const empty = { x: tree.x + 3, y: tree.y + 3 };
  expect(engine.describeTile(empty.x, empty.y)).toBe("Walk here");
});

test("a save that points at an unwalkable tile falls back to the spawn", () => {
  const engine = createMainlandEngine();
  engine.load({
    version: 1,
    name: "Guest",
    x: 6,
    y: 6,
    hitpoints: 10,
    xp: {},
    inventory: engine.state.player.inventory,
    equipment: {},
    bank: [],
    combatStyle: "aggressive",
  });

  expect({
    x: engine.state.player.x,
    y: engine.state.player.y,
  }).toEqual(RESPAWN_TILE);
  expect(engine.state.player.combatStyle).toBe("aggressive");
});

test("the combat style decides which skill the experience lands in", () => {
  const engine = createMainlandEngine();
  engine.setCombatStyle("aggressive");
  const chicken = engine.state.npcs.find((npc) => npc.defId === "chicken")!;

  act(engine, "attack", { kind: "npc", uid: chicken.uid });
  advanceUntil(engine, () => chicken.respawnTick !== null);

  expect(engine.state.player.skills.xp.strength).toBeGreaterThan(0);
  expect(engine.state.player.skills.xp.attack).toBe(0);
  expect(engine.state.player.skills.xp.defence).toBe(0);
});

test("renaming trims, caps at twelve characters, and ignores blanks", () => {
  const engine = createMainlandEngine();

  engine.setName("  Duke Horacio the Third  ");
  expect(engine.state.player.name).toBe("Duke Horacio");

  engine.setName("   ");
  expect(engine.state.player.name).toBe("Duke Horacio");
});
