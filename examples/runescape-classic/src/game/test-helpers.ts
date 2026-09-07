/** Shared helpers for driving the engine inside tests. */
import { Engine } from "./engine";
import { mulberry32 } from "./rng";
import { addItem, findSlot, type Target } from "./state";
import { objectAt, type WorldObject } from "./world";

export function createTestEngine(seed = 7): Engine {
  return new Engine({ random: mulberry32(seed) });
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

export function act(engine: Engine, action: string, target: Target): void {
  engine.choose({ label: action, action, target });
}

export function lastMessages(engine: Engine, count = 3): string[] {
  return engine.state.messages.slice(-count).map((message) => message.text);
}
