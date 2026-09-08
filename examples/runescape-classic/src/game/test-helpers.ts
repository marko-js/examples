/** Shared helpers for driving the engine inside tests. */
import { RESPAWN_TILE } from "./config";
import { Engine } from "./engine";
import { adjacentTile } from "./pathfinding";
import { mulberry32 } from "./rng";
import {
  addItem,
  createInventory,
  findSlot,
  type Npc,
  type Target,
} from "./state";
import { TUTORIAL_STAGES } from "./tutorial";
import { objectAt, type WorldObject } from "./world";

export function createTestEngine(seed = 7): Engine {
  return new Engine({ random: mulberry32(seed) });
}

/**
 * An engine with Tutorial Island behind it: the player stands in Lumbridge
 * carrying the kit the tutorial hands out, which is where the mainland
 * mechanics are exercised from.
 */
export function createMainlandEngine(seed = 7): Engine {
  const engine = createTestEngine(seed);
  const { player } = engine.state;
  player.tutorial = { stage: TUTORIAL_STAGES.length, done: true, flags: {} };
  player.x = RESPAWN_TILE.x;
  player.y = RESPAWN_TILE.y;
  player.fx = player.x;
  player.fy = player.y;
  player.inventory = createInventory([
    { id: "bronze_axe", count: 1 },
    { id: "bronze_pickaxe", count: 1 },
    { id: "tinderbox", count: 1 },
    { id: "small_net", count: 1 },
    { id: "bread", count: 3 },
    { id: "coins", count: 50 },
  ]);
  return engine;
}

/** Run the loop for `ms` of wall clock time in 100ms slices. */
export function advance(engine: Engine, ms: number): void {
  const start = engine.timestamp;
  for (let elapsed = 100; elapsed <= ms; elapsed += 100) {
    engine.advance(start + elapsed);
  }
}

/** Run the loop until `done` holds, or fail after `maxMs` of game time. */
export function advanceUntil(
  engine: Engine,
  done: () => boolean,
  maxMs = 300_000,
): void {
  for (let elapsed = 0; elapsed < maxMs; elapsed += 100) {
    engine.advance(engine.timestamp + 100);
    if (done()) return;
  }
  throw new Error("Timed out waiting for the game to reach the expected state");
}

export function nearestObject(
  engine: Engine,
  match: (object: WorldObject) => boolean,
): WorldObject {
  const { player, map } = engine.state;
  let best: WorldObject | undefined;
  let bestDistance = Infinity;
  for (const object of map.objects) {
    if (!object || !match(object)) continue;
    const distance = Math.hypot(object.x - player.x, object.y - player.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = object;
    }
  }
  if (!best) throw new Error("No matching object in the world");
  return best;
}

/** Light a fire on the player's tile, retrying until the roll succeeds. */
export function lightFire(engine: Engine): WorldObject {
  const { player } = engine.state;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (findSlot(player.inventory, "logs") === -1)
      addItem(player.inventory, "logs");
    engine.useOnSlot(
      findSlot(player.inventory, "tinderbox"),
      findSlot(player.inventory, "logs"),
    );
    const fire = objectAt(engine.state.map, player.x, player.y);
    if (fire?.defId === "fire") return fire;
  }
  throw new Error("The fire never caught");
}

/** The living NPC with this definition id. */
export function npcOf(engine: Engine, defId: string): Npc {
  const npc = engine.state.npcs.find(
    (entry) => entry.defId === defId && entry.respawnTick === null,
  );
  if (!npc) throw new Error(`No ${defId} in the world`);
  return npc;
}

/** Drop the player onto a walkable tile beside a point, skipping the walk. */
export function standNextTo(
  engine: Engine,
  at: { x: number; y: number },
): void {
  const tile = adjacentTile(engine.state.map, engine.state.player, at);
  if (!tile) throw new Error(`Nothing to stand on beside ${at.x},${at.y}`);
  const { player } = engine.state;
  player.x = tile.x;
  player.y = tile.y;
  player.fx = tile.x;
  player.fy = tile.y;
  player.path = [];
}

/**
 * Play a conversation out to its end, taking `choices` at each option list and
 * falling back to the first option.
 */
export function converse(
  engine: Engine,
  defId: string,
  choices: number[] = [],
): void {
  const npc = npcOf(engine, defId);
  standNextTo(engine, npc);
  act(engine, "talk", { kind: "npc", uid: npc.uid });
  const queue = [...choices];
  for (let step = 0; step < 200 && engine.state.dialogue; step++) {
    const view = engine.dialogueView;
    if (view?.options.length) engine.chooseDialogue(queue.shift() ?? 0);
    else engine.advanceDialogue();
  }
  if (engine.state.dialogue) throw new Error(`${defId} would not stop talking`);
}

export function act(engine: Engine, action: string, target: Target): void {
  engine.choose({ label: action, verb: action, action, target });
}

export function lastMessages(engine: Engine, count = 3): string[] {
  return engine.state.messages.slice(-count).map((message) => message.text);
}
