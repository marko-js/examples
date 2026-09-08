/** Draws the game view: terrain, scenery, actors, and the overlays above them. */
import { FLATTEN, RISE, tileSizeFor, WALL_HEIGHT } from "../config";
import { getItem } from "../items";
import { getNpcDef } from "../npcs";
import type { Point } from "../pathfinding";
import { hash2d } from "../rng";
import type { GameState, GroundItem, Npc, Player } from "../state";
import {
  getObjectDef,
  TERRAIN,
  TERRAIN_DEFS,
  type TerrainId,
  tileIndex,
  type WorldObject,
} from "../world";
import {
  type CharacterLook,
  drawCharacter,
  drawItemIcon,
  drawNpc,
  drawObjectArt,
} from "./sprites";

/** Top left corner of the view, in tile units. */
export interface Camera {
  x: number;
  y: number;
}

/** The surface being drawn to, in CSS pixels, and the tile size it implies. */
export interface Viewport {
  width: number;
  height: number;
  tile: number;
  /** Height of a tile on screen, foreshortened by the camera's pitch. */
  row: number;
  /** Surface point the player is kept at, so panels can shift them clear. */
  focus: Point;
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const EDGES = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
] as const;

/**
 * `visible` is the part of the surface no panel is covering. Tiles stay sized
 * from the whole surface so opening a panel never changes the zoom.
 */
export function viewportFor(
  width: number,
  height: number,
  visible?: { width: number; height: number },
): Viewport {
  const tile = tileSizeFor(width, height);
  return {
    width,
    height,
    tile,
    row: tile * FLATTEN,
    focus: {
      x: (visible?.width ?? width) / 2,
      y: (visible?.height ?? height) / 2,
    },
  };
}

export function cameraFor(state: GameState, view: Viewport): Camera {
  const { player, map } = state;
  const acrossX = view.width / view.tile;
  const acrossY = view.height / view.row;
  return {
    x: clamp(
      player.fx + 0.5 - view.focus.x / view.tile,
      0,
      Math.max(0, map.size - acrossX),
    ),
    y: clamp(
      player.fy + 0.5 - view.focus.y / view.row,
      0,
      Math.max(0, map.size - acrossY),
    ),
  };
}

export function tileAtScreen(
  camera: Camera,
  view: Viewport,
  screenX: number,
  screenY: number,
): Point {
  return {
    x: Math.floor(camera.x + screenX / view.tile),
    y: Math.floor(camera.y + screenY / view.row),
  };
}

export function renderWorld(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: Viewport,
  time: number,
  hover: Point | null,
): void {
  const camera = cameraFor(state, view);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, view.width, view.height);

  const bounds: Bounds = {
    minX: Math.floor(camera.x) - 1,
    minY: Math.floor(camera.y) - 1,
    maxX: Math.ceil(camera.x + view.width / view.tile) + 1,
    maxY: Math.ceil(camera.y + view.height / view.row) + 4,
  };

  drawTerrain(ctx, state, camera, view, time, bounds);
  drawFlatObjects(ctx, state, camera, view, time, bounds);
  drawDestination(ctx, state, camera, view, time);
  if (hover) drawHover(ctx, camera, view, hover);
  drawSortedLayer(ctx, state, camera, view, time, bounds);
  drawRoofs(ctx, state, camera, view);
  drawSplats(ctx, state, camera, view, time);
}

/* -------------------------------------------------------------- terrain */

function drawTerrain(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: Camera,
  view: Viewport,
  time: number,
  bounds: Bounds,
): void {
  drawGround(ctx, state, camera, view, bounds);

  const { tile, row } = view;
  for (let y = bounds.minY; y < bounds.maxY; y++) {
    for (let x = bounds.minX; x < bounds.maxX; x++) {
      const id = terrainId(state, x, y);
      if (isSoft(id)) continue;

      const sx = Math.round((x - camera.x) * tile);
      const sy = Math.round((y - camera.y) * row);
      ctx.fillStyle =
        id === TERRAIN.water
          ? TERRAIN_DEFS[id].colour
          : shade(TERRAIN_DEFS[id].colour, groundShade(x, y));
      ctx.fillRect(sx, sy, tile + 1, row + 1);

      if (id === TERRAIN.water) {
        drawWater(ctx, sx, sy, x, y, tile, row, time);
        drawSurf(ctx, state, x, y, sx, sy, tile, row);
      } else if (id === TERRAIN.stoneFloor) {
        drawFlagstones(ctx, sx, sy, tile, row);
      } else {
        drawPlanks(ctx, sx, sy, tile, row);
      }
    }
  }
}

/**
 * Classic shades the ground per vertex and lets the hardware interpolate, so
 * grass slides into path with no grid to see. Painting a small colour field
 * and scaling it up smoothly gets the same look for a few thousand pixels a
 * frame. `SHARPNESS` keeps the blend inside the seam: a tile is its own colour
 * across the middle, and only gives way near its edges.
 */
const SAMPLES_PER_TILE = 3;
const SHARPNESS = 2.2;

function drawGround(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: Camera,
  view: Viewport,
  bounds: Bounds,
): void {
  const width = (bounds.maxX - bounds.minX) * SAMPLES_PER_TILE;
  const height = (bounds.maxY - bounds.minY) * SAMPLES_PER_TILE;
  const canvas = (groundCanvas ??= document.createElement("canvas"));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const off = canvas.getContext("2d");
  if (!off) return;

  const image = off.createImageData(width, height);
  for (let j = 0; j < height; j++) {
    const worldY = bounds.minY + (j + 0.5) / SAMPLES_PER_TILE;
    for (let i = 0; i < width; i++) {
      const worldX = bounds.minX + (i + 0.5) / SAMPLES_PER_TILE;
      const at = (j * width + i) * 4;
      sampleGround(state, worldX, worldY, image.data, at);
      image.data[at + 3] = 255;
    }
  }
  off.putImageData(image, 0, 0);

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(
    canvas,
    (bounds.minX - camera.x) * view.tile,
    (bounds.minY - camera.y) * view.row,
    (bounds.maxX - bounds.minX) * view.tile,
    (bounds.maxY - bounds.minY) * view.row,
  );
  ctx.imageSmoothingEnabled = false;
}

let groundCanvas: HTMLCanvasElement | null = null;

/**
 * Blend the four tiles nearest a point. Water and built floors are painted
 * flat on top, so they are left out unless every tile around the point is one.
 */
function sampleGround(
  state: GameState,
  worldX: number,
  worldY: number,
  out: Uint8ClampedArray,
  at: number,
): void {
  const x = Math.floor(worldX - 0.5);
  const y = Math.floor(worldY - 0.5);
  const fx = seam(worldX - 0.5 - x);
  const fy = seam(worldY - 0.5 - y);
  const across = [(1 - fx) * (1 - fy), fx * (1 - fy), (1 - fx) * fy, fx * fy];

  for (const soft of [true, false]) {
    let red = 0;
    let green = 0;
    let blue = 0;
    let total = 0;

    for (const [corner, weight] of across.entries()) {
      const tx = x + (corner & 1);
      const ty = y + (corner >> 1);
      const id = terrainId(state, tx, ty);
      if (isSoft(id) !== soft || weight === 0) continue;
      const rgb = TERRAIN_RGB[id];
      const light = weight * groundShade(tx, ty);
      red += rgb[0] * light;
      green += rgb[1] * light;
      blue += rgb[2] * light;
      total += weight;
    }

    // Only fall back to the hard tiles when no soft one is in reach.
    if (!total) continue;
    out[at] = red / total;
    out[at + 1] = green / total;
    out[at + 2] = blue / total;
    return;
  }
}

/** Squeeze a 0..1 position between tile centres down to the seam between them. */
function seam(fraction: number): number {
  return Math.min(1, Math.max(0, (fraction - 0.5) * SHARPNESS + 0.5));
}

/** Water and built floors keep a hard edge; everything else blends. */
function isSoft(id: TerrainId): boolean {
  return (
    id !== TERRAIN.water &&
    id !== TERRAIN.bridge &&
    id !== TERRAIN.woodFloor &&
    id !== TERRAIN.stoneFloor
  );
}

const TERRAIN_RGB = Object.fromEntries(
  Object.entries(TERRAIN_DEFS).map(([id, def]) => {
    const value = parseInt(def.colour.slice(1), 16);
    return [id, [value >> 16, (value >> 8) & 0xff, value & 0xff]];
  }),
) as Record<TerrainId, [number, number, number]>;

/**
 * Classic's ground is flat shaded: each vertex takes one colour, varied at two
 * scales so the land reads as broad patches rather than noise.
 */
function groundShade(x: number, y: number): number {
  // Stagger the patch grid like brickwork so it does not read as squares.
  const patch = hash2d((x + (y >> 1)) >> 2, y >> 2, 5);
  const grain = hash2d(x, y, 9);
  return 0.86 + patch * 0.22 + grain * 0.1;
}

function drawWater(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  x: number,
  y: number,
  tile: number,
  row: number,
  time: number,
): void {
  for (let i = 0; i < 2; i++) {
    const drift = (time / 2600 + hash2d(x, y, i)) % 1;
    const width = tile * (0.25 + hash2d(x, y, i + 8) * 0.45);
    ctx.fillStyle = i ? "rgba(0,0,0,0.10)" : "rgba(200,228,255,0.14)";
    ctx.fillRect(
      sx + hash2d(x, y, i + 24) * (tile - width),
      sy + Math.round(drift * row),
      width,
      Math.max(1, row * 0.08),
    );
  }
}

/** A line of surf wherever water meets the shore. */
function drawSurf(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  x: number,
  y: number,
  sx: number,
  sy: number,
  tile: number,
  row: number,
): void {
  ctx.fillStyle = "rgba(206,230,255,0.32)";
  for (const [dx, dy] of EDGES) {
    if (terrainId(state, x + dx, y + dy) === TERRAIN.water) continue;
    fillEdge(ctx, sx, sy, tile, row, dx, dy, Math.max(2, row * 0.12));
  }
}

function drawPlanks(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  tile: number,
  row: number,
): void {
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  const gap = row / 3;
  for (let i = gap / 2; i < row; i += gap) {
    ctx.fillRect(sx, sy + Math.round(i), tile, 1);
  }
}

function drawFlagstones(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  tile: number,
  row: number,
): void {
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(sx, sy, tile, 1);
  ctx.fillRect(sx, sy, 1, row);
}

function fillEdge(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  tile: number,
  row: number,
  dx: number,
  dy: number,
  depth: number,
): void {
  if (dy === -1) ctx.fillRect(sx, sy, tile, depth);
  else if (dy === 1) ctx.fillRect(sx, sy + row - depth, tile, depth);
  else if (dx === -1) ctx.fillRect(sx, sy, depth, row);
  else ctx.fillRect(sx + tile - depth, sy, depth, row);
}

function terrainId(state: GameState, x: number, y: number): TerrainId {
  const { map } = state;
  if (x < 0 || y < 0 || x >= map.size || y >= map.size) return TERRAIN.water;
  return map.terrain[tileIndex(map, x, y)] as TerrainId;
}

/* -------------------------------------------------------- object layers */

function drawFlatObjects(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: Camera,
  view: Viewport,
  time: number,
  bounds: Bounds,
): void {
  forEachObject(state, bounds, (object) => {
    const def = getObjectDef(object.defId);
    if (!def.flat) return;
    const { sx, sy } = project(camera, view, object.x, object.y);
    drawObjectArt(ctx, def.art, sx, sy, view.tile, time, object.index);
  });
}

interface Drawable {
  sort: number;
  draw: () => void;
}

function drawSortedLayer(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: Camera,
  view: Viewport,
  time: number,
  bounds: Bounds,
): void {
  const drawables: Drawable[] = [];

  forEachObject(state, bounds, (object) => {
    const def = getObjectDef(object.defId);
    if (def.flat) return;
    const { sx, sy } = project(camera, view, object.x, object.y);
    drawables.push({
      sort: object.y,
      draw: () =>
        drawObjectArt(ctx, def.art, sx, sy, view.tile, time, object.index),
    });
  });

  for (const item of state.groundItems) {
    if (!inBounds(bounds, item.x, item.y)) continue;
    drawables.push({
      sort: item.y - 0.4,
      draw: () => drawGroundItem(ctx, camera, view, item),
    });
  }

  for (const npc of state.npcs) {
    if (npc.respawnTick !== null || !inBounds(bounds, npc.x, npc.y)) continue;
    drawables.push({
      sort: npc.fy,
      draw: () => drawNpcActor(ctx, camera, view, npc, time),
    });
  }

  if (state.player.respawnTick === null) {
    drawables.push({
      sort: state.player.fy,
      draw: () => drawPlayer(ctx, camera, view, state.player, time),
    });
  }

  drawables.sort((a, b) => a.sort - b.sort);
  for (const drawable of drawables) drawable.draw();
}

function drawGroundItem(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  view: Viewport,
  item: GroundItem,
): void {
  const { sx, sy } = project(camera, view, item.x, item.y);
  const size = view.tile * 0.56;
  drawItemIcon(ctx, item.id, sx - size / 2, sy - size * 1.1, size);
}

function drawNpcActor(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  view: Viewport,
  npc: Npc,
  time: number,
): void {
  const def = getNpcDef(npc.defId);
  const { sx, sy } = projectFloat(camera, view, npc.fx, npc.fy);
  drawNpc(
    ctx,
    sx,
    sy,
    view.tile,
    def.sprite,
    npc.facing,
    walkPhase(npc.path.length > 0, time),
  );
  if (npc.hitpoints < npc.maxHitpoints) {
    drawHealthBar(
      ctx,
      sx,
      sy - view.tile * 1.3,
      view.tile,
      npc.hitpoints / npc.maxHitpoints,
    );
  }
  if (npc.targetPlayer) {
    drawLabel(ctx, sx, sy - view.tile * 1.55, view.tile, def.name, "#ff9a3c");
  }
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  view: Viewport,
  player: Player,
  time: number,
): void {
  const { sx, sy } = projectFloat(camera, view, player.fx, player.fy);
  drawCharacter(
    ctx,
    sx,
    sy,
    view.tile,
    playerLook(player),
    player.facing,
    walkPhase(player.path.length > 0, time),
  );
  drawLabel(ctx, sx, sy - view.tile * 1.5, view.tile, player.name, "#ffffff");
  if (player.hitpoints < player.maxHitpoints) {
    drawHealthBar(
      ctx,
      sx,
      sy - view.tile * 1.32,
      view.tile,
      player.hitpoints / player.maxHitpoints,
    );
  }
}

export function playerLook(player: Player): CharacterLook {
  const colourOf = (id: string | undefined) =>
    id ? getItem(id).equip?.colour : undefined;
  return {
    skin: player.appearance.skin,
    hair: player.appearance.hair,
    shirt: colourOf(player.equipment.body) ?? player.appearance.shirt,
    legs: colourOf(player.equipment.legs) ?? player.appearance.legs,
    helmet: colourOf(player.equipment.helmet),
    weapon: colourOf(player.equipment.weapon),
    shield: colourOf(player.equipment.shield),
    cape: colourOf(player.equipment.cape),
    height: 1,
  };
}

/* ----------------------------------------------------------------- roofs */

/**
 * Classic's buildings wear a tiled roof that lifts away once you step inside,
 * which is most of what makes a town read as a town from outside.
 */
function drawRoofs(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: Camera,
  view: Viewport,
): void {
  const { player } = state;
  const lift = view.tile * WALL_HEIGHT * RISE;
  const eave = view.tile * 0.35;

  for (const roof of state.map.roofs) {
    if (
      player.x >= roof.x &&
      player.y >= roof.y &&
      player.x < roof.x + roof.w &&
      player.y < roof.y + roof.h
    ) {
      continue;
    }
    const left = (roof.x - camera.x) * view.tile - eave;
    const right = (roof.x + roof.w - camera.x) * view.tile + eave;
    const top = (roof.y - camera.y) * view.row - lift - eave * FLATTEN;
    const bottom =
      (roof.y + roof.h - camera.y) * view.row - lift + eave * FLATTEN;
    if (right < -40 || left > view.width + 40) continue;
    if (bottom < -40 || top > view.height + 40) continue;

    const ridge = (top + bottom) / 2;
    ctx.fillStyle = shade(roof.colour, 0.78);
    ctx.beginPath();
    ctx.moveTo(left, bottom);
    ctx.lineTo(left + eave * 1.6, ridge);
    ctx.lineTo(right - eave * 1.6, ridge);
    ctx.lineTo(right, bottom);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = shade(roof.colour, 1.12);
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(left + eave * 1.6, ridge);
    ctx.lineTo(right - eave * 1.6, ridge);
    ctx.lineTo(right, top);
    ctx.closePath();
    ctx.fill();

    // Courses of tiles down the front slope, then the ridge beam.
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    const courses = Math.max(
      2,
      Math.round((bottom - ridge) / (view.row * 0.5)),
    );
    for (let i = 1; i < courses; i++) {
      const t = i / courses;
      const y = ridge + (bottom - ridge) * t;
      const inset = eave * 1.6 * (1 - t);
      ctx.fillRect(left + inset, y, right - left - inset * 2, 1);
    }
    ctx.fillStyle = shade(roof.colour, 0.6);
    ctx.fillRect(left + eave * 1.6, ridge - 1, right - left - eave * 3.2, 2);
  }
}

/** Multiply a hex colour, for the lit and shaded halves of a roof. */
function shade(hex: string, factor: number): string {
  const value = parseInt(hex.slice(1), 16);
  const part = (shift: number) =>
    Math.min(255, Math.round(((value >> shift) & 0xff) * factor));
  return `rgb(${part(16)},${part(8)},${part(0)})`;
}

/* -------------------------------------------------------------- overlays */

/**
 * The click marker: a yellow cross at the tile you asked for, which flares as
 * it lands and holds while you walk, the way the client draws it.
 */
function drawDestination(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: Camera,
  view: Viewport,
  time: number,
): void {
  const marker = state.marker;
  if (!marker || !state.player.path.length) return;
  const { sx, sy } = project(camera, view, marker.x, marker.y);
  const age = Math.min(1, (time - marker.bornAt) / 220);
  const arm = view.tile * (0.3 - 0.12 * age) + Math.sin(time / 150) * 0.6;
  const cy = sy - view.row / 2;

  ctx.lineCap = "round";
  for (const [colour, width] of [
    ["rgba(0,0,0,0.7)", Math.max(4, view.tile / 7)],
    ["#ffe14a", Math.max(2, view.tile / 12)],
  ] as const) {
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(sx - arm, cy - arm);
    ctx.lineTo(sx + arm, cy + arm);
    ctx.moveTo(sx + arm, cy - arm);
    ctx.lineTo(sx - arm, cy + arm);
    ctx.stroke();
  }
  ctx.lineCap = "butt";
}

function drawHover(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  view: Viewport,
  hover: Point,
): void {
  const sx = Math.round((hover.x - camera.x) * view.tile);
  const sy = Math.round((hover.y - camera.y) * view.row);
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(sx + 0.5, sy + 0.5, view.tile - 1, view.row - 1);
}

function drawSplats(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: Camera,
  view: Viewport,
  time: number,
): void {
  const scale = Math.max(1, view.tile / 32);
  ctx.textAlign = "center";
  for (const splat of state.splats) {
    const age = (time - splat.bornAt) / 1200;
    if (age < 0 || age > 1) continue;
    const { sx, sy } = projectFloat(camera, view, splat.x, splat.y);
    const y = sy - view.tile * 0.9 - age * 18 * scale;
    ctx.globalAlpha = 1 - age * age;

    if (splat.tone === "damage" || splat.tone === "block") {
      ctx.fillStyle = splat.tone === "damage" ? "#c02020" : "#2f4f8f";
      ctx.beginPath();
      ctx.arc(sx, y, 9 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.round(11 * scale)}px 'Helvetica Neue', Arial, sans-serif`;
      ctx.fillText(splat.text, sx, y + 4 * scale);
    } else {
      ctx.fillStyle = splat.tone === "level" ? "#ffe14a" : "#8ce87a";
      ctx.font = `bold ${Math.round(12 * scale)}px 'Helvetica Neue', Arial, sans-serif`;
      ctx.strokeStyle = "rgba(0,0,0,0.7)";
      ctx.lineWidth = 3 * scale;
      ctx.strokeText(splat.text, sx, y);
      ctx.fillText(splat.text, sx, y);
    }
  }
  ctx.globalAlpha = 1;
}

function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tile: number,
  fraction: number,
): void {
  const width = tile * 0.88;
  const height = Math.max(3, tile / 8);
  ctx.fillStyle = "#7a1414";
  ctx.fillRect(x - width / 2, y, width, height);
  ctx.fillStyle = "#3fbf3f";
  ctx.fillRect(x - width / 2, y, Math.max(0, width * fraction), height);
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tile: number,
  text: string,
  colour: string,
): void {
  const size = Math.max(10, Math.round(tile / 3));
  ctx.font = `${size}px 'Helvetica Neue', Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.strokeStyle = "rgba(0,0,0,0.75)";
  ctx.lineWidth = Math.max(3, size / 3);
  ctx.strokeText(text, x, y);
  ctx.fillStyle = colour;
  ctx.fillText(text, x, y);
}

/* --------------------------------------------------------------- helpers */

function inBounds(bounds: Bounds, x: number, y: number): boolean {
  return (
    x >= bounds.minX && x <= bounds.maxX && y >= bounds.minY && y <= bounds.maxY
  );
}

function forEachObject(
  state: GameState,
  bounds: Bounds,
  visit: (object: WorldObject) => void,
): void {
  const { map } = state;
  for (
    let y = Math.max(0, bounds.minY);
    y < Math.min(map.size, bounds.maxY);
    y++
  ) {
    for (
      let x = Math.max(0, bounds.minX);
      x < Math.min(map.size, bounds.maxX);
      x++
    ) {
      const object = map.objects[tileIndex(map, x, y)];
      if (object) visit(object);
    }
  }
}

/** Screen position of the bottom centre of a tile. */
function project(
  camera: Camera,
  view: Viewport,
  x: number,
  y: number,
): { sx: number; sy: number } {
  return {
    sx: Math.round((x - camera.x) * view.tile + view.tile / 2),
    sy: Math.round((y - camera.y) * view.row + view.row),
  };
}

function projectFloat(
  camera: Camera,
  view: Viewport,
  x: number,
  y: number,
): { sx: number; sy: number } {
  return {
    sx: (x - camera.x) * view.tile + view.tile / 2,
    sy: (y - camera.y) * view.row + view.row,
  };
}

function walkPhase(moving: boolean, time: number): number {
  return moving ? (time / 90) % (Math.PI * 2) : 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
