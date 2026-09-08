/** Shared primitives for painting a map: terrain, scenery, roads and rooms. */
import { pick, randInt, type Rng } from "./rng";
import {
  inBounds,
  TERRAIN,
  type TerrainId,
  tileIndex,
  type WorldMap,
} from "./world";

export function terrain(map: WorldMap, x: number, y: number): TerrainId {
  if (!inBounds(map, x, y)) return TERRAIN.water;
  return map.terrain[tileIndex(map, x, y)] as TerrainId;
}

export function setTerrain(
  map: WorldMap,
  x: number,
  y: number,
  id: TerrainId,
): void {
  if (inBounds(map, x, y)) map.terrain[tileIndex(map, x, y)] = id;
}

export function softenShore(map: WorldMap, x: number, y: number): void {
  if (inBounds(map, x, y) && terrain(map, x, y) !== TERRAIN.water) {
    setTerrain(map, x, y, TERRAIN.sand);
  }
}

export function fillRect(
  map: WorldMap,
  x: number,
  y: number,
  w: number,
  h: number,
  id: TerrainId,
): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      if (terrain(map, x + dx, y + dy) !== TERRAIN.water)
        setTerrain(map, x + dx, y + dy, id);
    }
  }
}

export function patch(
  map: WorldMap,
  x: number,
  y: number,
  w: number,
  h: number,
  id: TerrainId,
): void {
  fillRect(map, x, y, w, h, id);
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) clear(map, x + dx, y + dy);
  }
}

export function place(
  map: WorldMap,
  x: number,
  y: number,
  defId: string,
): void {
  if (!inBounds(map, x, y)) return;
  const index = tileIndex(map, x, y);
  map.objects[index] = { index, defId, x, y };
}

/** Place only where scenery belongs: an empty, non-road, non-floor tile. */
export function placeScenery(
  map: WorldMap,
  x: number,
  y: number,
  defId: string,
): boolean {
  if (!inBounds(map, x, y)) return false;
  const index = tileIndex(map, x, y);
  if (map.objects[index]) return false;
  const id = map.terrain[index] as TerrainId;
  if (id === TERRAIN.path || id === TERRAIN.bridge) return false;
  if (id === TERRAIN.stoneFloor || id === TERRAIN.woodFloor) return false;
  const wet = id === TERRAIN.water;
  const wantsWater = defId.startsWith("fish_");
  if (wet !== wantsWater) return false;
  map.objects[index] = { index, defId, x, y };
  return true;
}

export function clear(map: WorldMap, x: number, y: number): void {
  if (inBounds(map, x, y)) map.objects[tileIndex(map, x, y)] = undefined;
}

/** Paint a walkable path along a polyline, two tiles wide. */
export function road(
  map: WorldMap,
  points: readonly (readonly [number, number])[],
): void {
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const steps = Math.max(
      1,
      Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) * 2,
    );
    for (let step = 0; step <= steps; step++) {
      const t = step / steps;
      const x = Math.round(x1 + (x2 - x1) * t);
      const y = Math.round(y1 + (y2 - y1) * t);
      for (const [dx, dy] of [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ] as const) {
        if (terrain(map, x + dx, y + dy) === TERRAIN.water) continue;
        setTerrain(map, x + dx, y + dy, TERRAIN.path);
        clear(map, x + dx, y + dy);
      }
    }
  }
}

/** Turn the stretch of river the road meets into a walkable bridge. */
export function bridgeOverWater(
  map: WorldMap,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      if (terrain(map, x + dx, y + dy) === TERRAIN.water) {
        setTerrain(map, x + dx, y + dy, TERRAIN.bridge);
        clear(map, x + dx, y + dy);
      }
    }
  }
}

export interface BuildingOptions {
  wall: string;
  /** Roof colour; omit for a walled area that should stay open to the sky. */
  roof?: string;
  floor: TerrainId;
  doors: readonly (readonly [number, number])[];
}

export function building(
  map: WorldMap,
  x: number,
  y: number,
  w: number,
  h: number,
  options: BuildingOptions,
): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const tx = x + dx;
      const ty = y + dy;
      setTerrain(map, tx, ty, options.floor);
      const onEdge = dx === 0 || dy === 0 || dx === w - 1 || dy === h - 1;
      if (onEdge) place(map, tx, ty, options.wall);
      else clear(map, tx, ty);
    }
  }
  for (const [dx, dy] of options.doors) place(map, dx, dy, "gate");
  if (options.roof !== null) {
    map.roofs.push({ x, y, w, h, colour: options.roof ?? ROOF_TILE });
  }
}

/** The red clay roof Classic put on almost everything. */
export const ROOF_TILE = "#a0503c";
export const ROOF_WOOD = "#8a5f33";

/** Fenced enclosure with gates punched through the perimeter. */
/** Fence around a rect's perimeter, leaving the inside untouched. */
export function fence(
  map: WorldMap,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  for (let dx = 0; dx < w; dx++) {
    place(map, x + dx, y, "fence");
    place(map, x + dx, y + h - 1, "fence");
  }
  for (let dy = 0; dy < h; dy++) {
    place(map, x, y + dy, "fence");
    place(map, x + w - 1, y + dy, "fence");
  }
}

export function field(
  map: WorldMap,
  x: number,
  y: number,
  w: number,
  h: number,
  gates: readonly (readonly [number, number])[],
  floor: TerrainId,
): void {
  fillRect(map, x + 1, y + 1, w - 2, h - 2, floor);
  for (let dy = 1; dy < h - 1; dy++) {
    for (let dx = 1; dx < w - 1; dx++) clear(map, x + dx, y + dy);
  }
  for (let dx = 0; dx < w; dx++) {
    place(map, x + dx, y, "fence");
    place(map, x + dx, y + h - 1, "fence");
  }
  for (let dy = 0; dy < h; dy++) {
    place(map, x, y + dy, "fence");
    place(map, x + w - 1, y + dy, "fence");
  }
  for (const [gx, gy] of gates) place(map, gx, gy, "gate");
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function scatter(
  map: WorldMap,
  rng: Rng,
  rect: Rect,
  defIds: readonly string[],
  count: number,
): void {
  let remaining = count;
  for (let i = 0; i < count * 8 && remaining > 0; i++) {
    const x = randInt(rng, rect.x, rect.x + rect.w - 1);
    const y = randInt(rng, rect.y, rect.y + rect.h - 1);
    if (placeScenery(map, x, y, pick(rng, defIds))) remaining--;
  }
}

export function isEdgeOf(
  map: WorldMap,
  x: number,
  y: number,
  id: TerrainId,
): boolean {
  if (terrain(map, x, y) !== id) return false;
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const) {
    if (terrain(map, x + dx, y + dy) !== id) return true;
  }
  return false;
}
