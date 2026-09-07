/**
 * Builds the world: the free-to-play RuneScape Classic mainland, with Tutorial
 * Island out in the sea to its south east. Generation is seeded, so the map is
 * identical on the server render and in the browser.
 */
import { WORLD_SIZE } from "./config";
import { layMainland } from "./mainland";
import { mulberry32 } from "./rng";
import { layTutorialIsland } from "./tutorialgen";
import { TERRAIN, type WorldMap } from "./world";

export function generateWorld(seed = 20250907): WorldMap {
  const size = WORLD_SIZE;
  const map: WorldMap = {
    size,
    terrain: new Uint8Array(size * size).fill(TERRAIN.water),
    objects: new Array(size * size),
    spawns: [],
    labels: [],
  };

  layMainland(map, mulberry32(seed));
  layTutorialIsland(map);

  return map;
}
