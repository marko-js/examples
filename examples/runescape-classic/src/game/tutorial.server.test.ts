import { RESPAWN_TILE, TUTORIAL_START } from "./config";
import { countItem, findSlot } from "./state";
import {
  act,
  advanceUntil,
  converse,
  createTestEngine,
  lightFire,
  npcOf,
  standNextTo,
} from "./test-helpers";
import { TUTORIAL_STAGES } from "./tutorial";
import { getObjectDef, objectAt, type WorldObject } from "./world";

function objectOf(engine: ReturnType<typeof createTestEngine>, defId: string) {
  const found = engine.state.map.objects.find(
    (object): object is WorldObject => object?.defId === defId,
  );
  if (!found) throw new Error(`No ${defId} in the world`);
  return found;
}

/** Walk up to an object and run its first menu action until `done` holds. */
function use(
  engine: ReturnType<typeof createTestEngine>,
  defId: string,
  done: () => boolean,
) {
  const object = objectOf(engine, defId);
  standNextTo(engine, object);
  act(engine, "gather", { kind: "object", index: object.index });
  advanceUntil(engine, done);
}

test("a new character starts on Tutorial Island with the first door shut", () => {
  const engine = createTestEngine();
  const { player } = engine.state;

  expect({ x: player.x, y: player.y }).toEqual(TUTORIAL_START);
  expect(player.tutorial).toEqual({ stage: 0, done: false, flags: {} });
  expect(engine.tutorialObjective).toBe(TUTORIAL_STAGES[0].objective);
  expect(engine.state.map.objects.some((o) => o?.defId === "tut_door")).toBe(
    true,
  );
});

test("a shut door explains itself rather than opening", () => {
  const engine = createTestEngine();
  const door = objectOf(engine, "tut_door");

  const options = engine.optionsAt(door.x, door.y).map((o) => o.label);
  expect(options).toEqual(["Open Door", "Examine Door"]);

  standNextTo(engine, door);
  act(engine, "door", { kind: "object", index: door.index });
  expect(engine.state.messages.at(-1)?.text).toBe(TUTORIAL_STAGES[0].blocked);
  expect(getObjectDef(door.defId).blocking).toBe(true);
});

test("the Gielinor Guide opens the way out of the starting house", () => {
  const engine = createTestEngine();
  const door = objectOf(engine, "tut_door");

  converse(engine, "gielinor_guide");

  expect(engine.state.player.tutorial.stage).toBe(1);
  expect(objectAt(engine.state.map, door.x, door.y)?.defId).toBe("gate");
});

test("the whole tutorial can be played through to Lumbridge", () => {
  const engine = createTestEngine();
  const { player } = engine.state;
  const stage = () => player.tutorial.stage;

  // 1. The Guide.
  converse(engine, "gielinor_guide");
  expect(stage()).toBe(1);

  // 2. Fishing: the Survival Expert hands over a net for the pond.
  converse(engine, "survival_expert");
  expect(countItem(player.inventory, "small_net")).toBe(1);
  use(engine, "fish_net", () => countItem(player.inventory, "raw_shrimp") > 0);
  converse(engine, "survival_expert");
  expect(stage()).toBe(2);
  expect(countItem(player.inventory, "bronze_axe")).toBe(1);

  // 3. Woodcutting, firemaking and cooking on the fire.
  use(engine, "tree", () => countItem(player.inventory, "logs") > 0);
  const fire = lightFire(engine);
  player.selectedSlot = findSlot(player.inventory, "raw_shrimp");
  act(engine, "use", { kind: "object", index: fire.index });
  expect(player.tutorial.flags.shrimpCooked).toBe(true);
  converse(engine, "survival_expert");
  expect(stage()).toBe(3);

  // 4. The Master Chef: flour plus water, then the range.
  converse(engine, "master_chef");
  engine.useOnSlot(
    findSlot(player.inventory, "pot_of_flour"),
    findSlot(player.inventory, "bucket_of_water"),
  );
  expect(countItem(player.inventory, "bread_dough")).toBe(1);
  const range = objectOf(engine, "range");
  standNextTo(engine, range);
  player.selectedSlot = findSlot(player.inventory, "bread_dough");
  act(engine, "use", { kind: "object", index: range.index });
  expect(countItem(player.inventory, "bread")).toBe(1);
  converse(engine, "master_chef");
  expect(stage()).toBe(4);

  // 5. The Quest Guide only talks.
  converse(engine, "quest_guide");
  expect(stage()).toBe(5);

  // 6. Mining, smelting and smithing.
  converse(engine, "mining_instructor");
  expect(countItem(player.inventory, "bronze_pickaxe")).toBe(1);
  use(
    engine,
    "rock_copper",
    () => countItem(player.inventory, "copper_ore") > 0,
  );
  use(engine, "rock_tin", () => countItem(player.inventory, "tin_ore") > 0);
  const furnace = objectOf(engine, "furnace");
  standNextTo(engine, furnace);
  player.selectedSlot = findSlot(player.inventory, "copper_ore");
  act(engine, "use", { kind: "object", index: furnace.index });
  expect(countItem(player.inventory, "bronze_bar")).toBe(1);
  converse(engine, "mining_instructor");
  expect(countItem(player.inventory, "hammer")).toBe(1);
  const anvil = objectOf(engine, "anvil");
  standNextTo(engine, anvil);
  player.selectedSlot = findSlot(player.inventory, "bronze_bar");
  act(engine, "use", { kind: "object", index: anvil.index });
  expect(countItem(player.inventory, "bronze_dagger")).toBe(1);
  expect(stage()).toBe(6);

  // 7. Melee: gear from the instructor, then a rat.
  converse(engine, "combat_instructor");
  expect(countItem(player.inventory, "bronze_sword")).toBe(1);
  expect(countItem(player.inventory, "wooden_shield")).toBe(1);
  engine.inventoryAction(findSlot(player.inventory, "bronze_sword"), "equip");
  const rat = npcOf(engine, "tutorial_rat");
  standNextTo(engine, rat);
  act(engine, "attack", { kind: "npc", uid: rat.uid });
  advanceUntil(engine, () => player.tutorial.flags.ratKilled === true);
  expect(stage()).toBe(7);

  // 8. Ranged: a bow, arrows and a second rat.
  converse(engine, "combat_instructor");
  expect(countItem(player.inventory, "bronze_arrows")).toBe(50);
  engine.inventoryAction(findSlot(player.inventory, "shortbow"), "equip");
  engine.inventoryAction(findSlot(player.inventory, "bronze_arrows"), "equip");
  const secondRat = npcOf(engine, "tutorial_rat");
  standNextTo(engine, secondRat);
  act(engine, "attack", { kind: "npc", uid: secondRat.uid });
  advanceUntil(engine, () => player.tutorial.flags.ratShot === true);
  converse(engine, "combat_instructor");
  expect(stage()).toBe(8);
  expect(player.skills.xp.ranged).toBeGreaterThan(0);

  // 9. The bank.
  converse(engine, "account_guide", [0]);
  expect(engine.state.overlay.kind).toBe("bank");
  engine.closeOverlay();
  expect(stage()).toBe(9);

  // 10. Prayer.
  converse(engine, "brother_brace");
  engine.inventoryAction(findSlot(player.inventory, "bones"), "bury");
  expect(player.skills.xp.prayer).toBeGreaterThan(0);
  expect(stage()).toBe(10);

  // 11. Magic, then the boat home.
  converse(engine, "magic_instructor");
  expect(countItem(player.inventory, "air_rune")).toBe(25);
  engine.selectSpell("wind_strike");
  const chicken = npcOf(engine, "tutorial_chicken");
  standNextTo(engine, chicken);
  act(engine, "cast", { kind: "npc", uid: chicken.uid });
  expect(player.tutorial.flags.spellCast).toBe(true);
  expect(player.skills.xp.magic).toBeGreaterThan(0);

  converse(engine, "magic_instructor", [0]);
  expect(player.tutorial.done).toBe(true);
  expect({ x: player.x, y: player.y }).toEqual(RESPAWN_TILE);
  expect(engine.tutorialObjective).toBeNull();
});
