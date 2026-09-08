/**
 * Draws the game view the way Classic did: a pitched camera looking north over
 * a gouraud shaded ground, with everything that has height standing up out of
 * it as flat shaded faces and fading into the void at the draw distance.
 *
 * The world goes into a small buffer, about the size of Classic's own window,
 * and is blown up to fill the surface. Text goes on over the top at full
 * resolution so names and hitsplats stay readable.
 */
import { BUFFER_LONG_AXIS, DRAW_DISTANCE, WALL_HEIGHT } from "../config";
import { getItem } from "../items";
import { getNpcDef } from "../npcs";
import type { Point } from "../pathfinding";
import { hash2d } from "../rng";
import type { GameState, GroundItem, Npc, Player } from "../state";
import {
  getObjectDef,
  type ObjectArt,
  type Roof,
  TERRAIN,
  TERRAIN_DEFS,
  type TerrainId,
  tileIndex,
  type WorldObject,
} from "../world";
import { drawBeast, drawBird, drawPerson } from "./actors";
import { box, face, fogAt, rgbOf, type Vertex } from "./paint";
import {
  type Camera,
  cameraAt,
  type CameraView,
  defaultView,
  depthAtRow,
  groundAt,
  project,
  type Projected,
} from "./projection";
import { drawScenery } from "./scenery";
import { type CharacterLook, drawItemIcon, drawObjectArt } from "./sprites";

/** The surface being drawn to, in CSS pixels, and the buffer behind it. */
export interface Viewport {
  width: number;
  height: number;
  /** Buffer pixels per CSS pixel. */
  scale: number;
  /** Surface point the player is kept at, so panels can shift them clear. */
  focus: Point;
}

/** Past the draw distance there is nothing, the way Classic showed it. */
const VOID = 0;
const FOG_TILES = 8;

export function viewportFor(
  width: number,
  height: number,
  visible?: { width: number; height: number },
): Viewport {
  return {
    width,
    height,
    scale: Math.min(1, BUFFER_LONG_AXIS / Math.max(width, height)),
    focus: {
      x: (visible?.width ?? width) / 2,
      // The player sits below centre so most of the view is the way ahead.
      y: (visible?.height ?? height) * 0.64,
    },
  };
}

export function cameraFor(
  state: GameState,
  view: Viewport,
  look: CameraView = defaultView(),
): Camera {
  const { player } = state;
  return cameraAt(
    { x: player.fx + 0.5, y: player.fy + 0.5 },
    { x: view.focus.x * view.scale, y: view.focus.y * view.scale },
    Math.max(1, Math.round(view.width * view.scale)),
    Math.max(1, Math.round(view.height * view.scale)),
    look,
  );
}

/** The stretch of ground the camera can see, as a box in tiles. */
export interface ViewBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function viewBox(
  camera: Camera,
  width: number,
  height: number,
): ViewBox {
  const far = DRAW_DISTANCE * camera.cos + camera.z * camera.sin;
  const edge = (sx: number, forward: number, depth: number) => {
    const across = ((sx - camera.cx) * depth) / camera.focal;
    return {
      x: camera.x + camera.fx * forward + camera.rx * across,
      y: camera.y + camera.fy * forward + camera.ry * across,
    };
  };
  const corners = [
    groundAt(camera, 0, height - 0.5) ?? { x: camera.x, y: camera.y },
    groundAt(camera, width, height - 0.5) ?? { x: camera.x, y: camera.y },
    edge(0, DRAW_DISTANCE, far),
    edge(width, DRAW_DISTANCE, far),
    { x: camera.x, y: camera.y },
  ];
  return {
    minX: Math.min(...corners.map((at) => at.x)) - 2,
    minY: Math.min(...corners.map((at) => at.y)) - 2,
    maxX: Math.max(...corners.map((at) => at.x)) + 2,
    maxY: Math.max(...corners.map((at) => at.y)) + 2,
  };
}

export function tileAtScreen(
  camera: Camera,
  view: Viewport,
  screenX: number,
  screenY: number,
): Point {
  const ground = groundAt(camera, screenX * view.scale, screenY * view.scale);
  const at = ground ?? { x: camera.x, y: camera.y - DRAW_DISTANCE };
  return { x: Math.floor(at.x), y: Math.floor(at.y) };
}

/**
 * The tile a click means. Anything standing up covers the ground behind it, so
 * a click on a person's chest or a tree's crown picks them rather than the
 * tile they happen to be drawn over, which is what the client does.
 */
export function pickTile(
  state: GameState,
  camera: Camera,
  view: Viewport,
  screenX: number,
  screenY: number,
): Point {
  const x = screenX * view.scale;
  const y = screenY * view.scale;
  const best = { depth: Infinity, tile: null as Point | null };

  const consider = (
    tile: Point,
    fx: number,
    fy: number,
    across: number,
    tall: number,
  ) => {
    const spot = project(camera, fx + 0.5, fy + 0.5, 0);
    if (spot.depth <= 0.3 || fogAt(camera, spot.depth) <= 0) return;
    const size = camera.focal / spot.depth;
    const half = (size * across) / 2;
    if (x < spot.sx - half || x > spot.sx + half) return;
    if (y > spot.sy || y < spot.sy - size * tall) return;
    if (spot.depth < best.depth) {
      best.depth = spot.depth;
      best.tile = tile;
    }
  };

  for (const npc of state.npcs) {
    if (npc.respawnTick !== null) continue;
    consider({ x: npc.x, y: npc.y }, npc.fx, npc.fy, 0.75, 1.7);
  }

  const { map } = state;
  const box = viewBox(
    camera,
    view.width * view.scale,
    view.height * view.scale,
  );
  const minY = Math.max(0, Math.floor(box.minY));
  const maxY = Math.min(map.size, Math.ceil(box.maxY));
  const minX = Math.max(0, Math.floor(box.minX));
  const maxX = Math.min(map.size, Math.ceil(box.maxX));
  for (let ty = minY; ty < maxY; ty++) {
    for (let tx = minX; tx < maxX; tx++) {
      const object = map.objects[tileIndex(map, tx, ty)];
      if (!object) continue;
      const tall = STANDING[getObjectDef(object.defId).art.kind];
      if (tall) consider({ x: tx, y: ty }, tx, ty, 1, tall);
    }
  }

  return best.tile ?? tileAtScreen(camera, view, screenX, screenY);
}

/** How far up the screen each kind of scenery reaches, in tiles. */
const STANDING: Partial<Record<ObjectArt["kind"], number>> = {
  tree: 2.4,
  wall: WALL_HEIGHT,
  rock: 0.7,
  furnace: 1.8,
  range: 0.9,
  altar: 1.1,
  well: 1.9,
  sign: 1,
  boat: 2.1,
  door: 1.5,
  chest: 0.7,
  counter: 0.8,
  table: 0.8,
};

/* ---------------------------------------------------------------- surface */

let buffer: HTMLCanvasElement | null = null;

function bufferFor(width: number, height: number): CanvasRenderingContext2D {
  const canvas = (buffer ??= document.createElement("canvas"));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  return canvas.getContext("2d")!;
}

export function renderWorld(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  view: Viewport,
  time: number,
  hover: Point | null,
  look: CameraView = defaultView(),
): void {
  const width = Math.max(1, Math.round(view.width * view.scale));
  const height = Math.max(1, Math.round(view.height * view.scale));
  const scene = bufferFor(width, height);
  const camera = cameraFor(state, view, look);
  const box = viewBox(camera, width, height);

  drawGround(scene, state, camera, box, width, height);
  drawScene(scene, state, camera, box, width, height, time, hover);

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, view.width, view.height);
  ctx.drawImage(scene.canvas, 0, 0, view.width, view.height);
  drawLabels(ctx, state, camera, view, time);
}

/* ----------------------------------------------------------------- ground */

/**
 * Classic shaded the ground per vertex and let the hardware interpolate. The
 * colours are baked into a small field first, then every pixel below the
 * horizon reads its ground point out of that field, which gets the
 * perspective and the smooth shading in one pass.
 */
const SAMPLES_PER_TILE = 6;
const SHARPNESS = 2.2;

interface Field {
  x: number;
  y: number;
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

/**
 * Terrain does not change while you play and the field only shifts when the
 * player crosses a tile, so it is worth keeping between frames.
 */
let cached: (Field & { map: unknown }) | null = null;

function buildField(state: GameState, box: ViewBox): Field {
  const x = Math.floor(box.minX);
  const y = Math.floor(box.minY);
  const width = (Math.ceil(box.maxX) - x) * SAMPLES_PER_TILE;
  const height = (Math.ceil(box.maxY) - y) * SAMPLES_PER_TILE;
  const stride = 4;
  if (
    cached &&
    cached.map === state.map &&
    cached.x === x &&
    cached.y === y &&
    cached.width === width &&
    cached.height === height
  ) {
    return cached;
  }
  const data = new Uint8ClampedArray(width * height * stride);

  for (let j = 0; j < height; j++) {
    const worldY = y + (j + 0.5) / SAMPLES_PER_TILE;
    for (let i = 0; i < width; i++) {
      const worldX = x + (i + 0.5) / SAMPLES_PER_TILE;
      sampleGround(state, worldX, worldY, data, (j * width + i) * stride);
    }
  }
  cached = { x, y, width, height, data, map: state.map };
  return cached;
}

/**
 * Blend the four tiles nearest a point, with the blend squeezed into the seam
 * so a tile still reads as its own colour across the middle. Water and built
 * floors keep hard edges, so they win outright wherever they touch.
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
    let rough = 0;
    let surface: TerrainId = TERRAIN.grass;
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
      if (weight > rough) {
        rough = weight;
        surface = id;
      }
      total += weight;
    }

    if (!total) continue;
    const lit = slopeLight(worldX, worldY) - 1;
    out[at] = (red / total) * (1 + lit * CHANNEL_GAIN[0]);
    out[at + 1] = (green / total) * (1 + lit * CHANNEL_GAIN[1]);
    out[at + 2] = (blue / total) * (1 + lit * CHANNEL_GAIN[2]);
    // The fourth channel names the surface, so the pixel pass can texture it.
    out[at + 3] = surface;
    return;
  }
}

/** Squeeze a 0..1 position between tile centres down to the seam between them. */
function seam(fraction: number): number {
  return Math.min(1, Math.max(0, (fraction - 0.5) * SHARPNESS + 0.5));
}

/**
 * Ground that grows blends into its neighbours; anything laid down — a road,
 * a floor, the water's edge — is laid tile by tile and keeps that edge.
 */
function isSoft(id: TerrainId): boolean {
  return (
    id === TERRAIN.grass ||
    id === TERRAIN.darkGrass ||
    id === TERRAIN.dirt ||
    id === TERRAIN.sand ||
    id === TERRAIN.swamp
  );
}

const TERRAIN_RGB = Object.fromEntries(
  Object.entries(TERRAIN_DEFS).map(([id, def]) => [id, rgbOf(def.colour)]),
) as Record<TerrainId, [number, number, number]>;

/** Ground brightness per tile: broad patches with a little grain on top. */
function groundShade(x: number, y: number): number {
  // Stagger the patch grid like brickwork so it does not read as squares.
  const patch = hash2d((x + (y >> 1)) >> 2, y >> 2, 5);
  const grain = hash2d(x, y, 9);
  return 0.93 + patch * 0.1 + grain * 0.05;
}

/**
 * The slow sweep of light across the land. Classic's ground rises and falls,
 * and the light on it runs from nearly yellow on a lit slope to nearly black
 * in a hollow; the ground here is flat, so the light carries that on its own.
 * It is smooth noise rather than per tile, or the hillsides would be squares.
 */
const SLOPE_TILES = 11;

function slopeLight(x: number, y: number): number {
  const gx = x / SLOPE_TILES;
  const gy = y / SLOPE_TILES;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const fx = smooth(gx - x0);
  const fy = smooth(gy - y0);
  const top = hash2d(x0, y0, 17) * (1 - fx) + hash2d(x0 + 1, y0, 17) * fx;
  const bottom =
    hash2d(x0, y0 + 1, 17) * (1 - fx) + hash2d(x0 + 1, y0 + 1, 17) * fx;
  return 0.83 + (top * (1 - fy) + bottom * fy) * 0.24;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * Light does not fall evenly across the channels: a lit patch of Classic's
 * grass goes yellow rather than simply paler, and a shaded one goes cold.
 */
const CHANNEL_GAIN = [1.5, 1, 0.7];

function drawGround(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: Camera,
  box: ViewBox,
  width: number,
  height: number,
): void {
  const field = buildField(state, box);
  const image = ctx.createImageData(width, height);
  const pixels = image.data;

  for (let sy = 0; sy < height; sy++) {
    let at = sy * width * 4;
    const depth = depthAtRow(camera, sy + 0.5);
    const forward = (depth - camera.z * camera.sin) / camera.cos;
    if (!Number.isFinite(depth) || forward > DRAW_DISTANCE) {
      for (let sx = 0; sx < width; sx++, at += 4) {
        pixels[at] = VOID;
        pixels[at + 1] = VOID;
        pixels[at + 2] = VOID;
        pixels[at + 3] = 255;
      }
      continue;
    }

    // A screen row still meets the ground along a straight line, whichever way
    // the camera is turned, so the walk across it stays two additions a pixel.
    const fog = Math.min(1, (DRAW_DISTANCE - forward) / FOG_TILES);
    const across = depth / camera.focal;
    const start = (0.5 - camera.cx) * across;
    let worldX = camera.x + camera.fx * forward + camera.rx * start;
    let worldY = camera.y + camera.fy * forward + camera.ry * start;
    const stepX = camera.rx * across;
    const stepY = camera.ry * across;

    for (let sx = 0; sx < width; sx++, at += 4) {
      sampleField(
        field,
        (worldX - field.x) * SAMPLES_PER_TILE - 0.5,
        (worldY - field.y) * SAMPLES_PER_TILE - 0.5,
        fog,
        worldX,
        worldY,
        pixels,
        at,
      );
      pixels[at + 3] = 255;
      worldX += stepX;
      worldY += stepY;
    }
  }
  ctx.putImageData(image, 0, 0);
}

function sampleField(
  field: Field,
  fx: number,
  fy: number,
  fog: number,
  worldX: number,
  worldY: number,
  out: Uint8ClampedArray,
  at: number,
): void {
  const x = Math.floor(fx);
  const y = Math.floor(fy);
  if (x < 0 || y < 0 || x >= field.width - 1 || y >= field.height - 1) {
    out[at] = VOID;
    out[at + 1] = VOID;
    out[at + 2] = VOID;
    return;
  }
  const rx = fx - x;
  const ry = fy - y;
  const row = y * field.width;
  const a = (row + x) * 4;
  const b = (row + x + 1) * 4;
  const c = (row + field.width + x) * 4;
  const d = (row + field.width + x + 1) * 4;
  // The nearest sample names the surface; the texture on it is per pixel.
  const nearest = (rx < 0.5 ? (ry < 0.5 ? a : c) : ry < 0.5 ? b : d) + 3;
  const light =
    fog * surfaceTexture(field.data[nearest] as TerrainId, worldX, worldY);

  for (let channel = 0; channel < 3; channel++) {
    const blended =
      (field.data[a + channel] * (1 - rx) + field.data[b + channel] * rx) *
        (1 - ry) +
      (field.data[c + channel] * (1 - rx) + field.data[d + channel] * rx) * ry;
    out[at + channel] = blended * light;
  }
}

/**
 * RuneScape 2 textured its ground rather than colouring it flat, and the
 * cobbled road through a town is the most recognisable thing about it. Each
 * surface gets its own pattern, returned as a brightness to scale the tile
 * colour by.
 */
function surfaceTexture(id: TerrainId, x: number, y: number): number {
  switch (id) {
    case TERRAIN.path:
    case TERRAIN.gravel:
      return cobbles(x, y, 2.6, 0.4, 0.3);
    case TERRAIN.stoneFloor:
      return cobbles(x, y, 1.5, 0.44, 0.16);
    case TERRAIN.woodFloor:
    case TERRAIN.bridge:
      return planks(x, y);
    case TERRAIN.water:
      return 1;
    case TERRAIN.dirt:
    case TERRAIN.sand:
      return 1 + (noise(x, y, 7) - 0.5) * 0.24;
    default:
      return 1 + (noise(x, y, 5) - 0.5) * 0.3;
  }
}

/** Irregular stones with mortar between them, laid `per` to a tile. */
function cobbles(
  x: number,
  y: number,
  per: number,
  edge: number,
  gap: number,
): number {
  const gx = x * per;
  const gy = y * per;
  const cx = Math.floor(gx);
  const cy = Math.floor(gy);
  const jx = cx + 0.5 + (hash2d(cx, cy, 1) - 0.5) * 0.42;
  const jy = cy + 0.5 + (hash2d(cx, cy, 2) - 0.5) * 0.42;
  const away = Math.max(Math.abs(gx - jx), Math.abs(gy - jy));
  const mortar = away > edge ? -gap : 0;
  return 1 + mortar + (hash2d(cx, cy, 3) - 0.5) * 0.26;
}

/** Boards running east to west, three to a tile. */
function planks(x: number, y: number): number {
  const along = y * 3;
  const board = Math.floor(along);
  const seam = Math.abs(along - board - 0.5) > 0.45 ? -0.14 : 0;
  return 1 + seam + (hash2d(Math.floor(x), board, 4) - 0.5) * 0.1;
}

/** Two octaves of value noise, for the surfaces that are simply grainy. */
function noise(x: number, y: number, seed: number): number {
  return (
    hash2d(Math.floor(x * 5), Math.floor(y * 5), seed) * 0.6 +
    hash2d(Math.floor(x * 13), Math.floor(y * 13), seed + 1) * 0.4
  );
}

function terrainId(state: GameState, x: number, y: number): TerrainId {
  const { map } = state;
  if (x < 0 || y < 0 || x >= map.size || y >= map.size) return TERRAIN.water;
  return map.terrain[tileIndex(map, x, y)] as TerrainId;
}

/* ------------------------------------------------------------------ scene */

interface Drawable {
  depth: number;
  draw: () => void;
}

/** Hands a drawable to the scene, given where on the buffer it lands. */
type Add = (spot: Projected, draw: () => void) => void;

function drawScene(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: Camera,
  box: ViewBox,
  width: number,
  height: number,
  time: number,
  hover: Point | null,
): void {
  const { map, player } = state;
  const drawables: Drawable[] = [];
  // Everything is anchored at its base, so allow for what stands above it and
  // for how wide it might be, then drop whatever misses the buffer entirely.
  const add: Add = (spot, draw) => {
    if (spot.depth <= 0.3 || fogAt(camera, spot.depth) <= 0) return;
    const size = camera.focal / spot.depth;
    if (spot.sx + size * 2.5 < 0 || spot.sx - size * 2.5 > width) return;
    if (spot.sy + size < 0 || spot.sy - size * 3.5 > height) return;
    drawables.push({ depth: spot.depth, draw });
  };

  if (hover) addHover(ctx, camera, hover, add);
  addMarker(ctx, state, camera, time, add);

  const minY = Math.max(0, Math.floor(box.minY));
  const maxY = Math.min(map.size, Math.ceil(box.maxY));
  const minX = Math.max(0, Math.floor(box.minX));
  const maxX = Math.min(map.size, Math.ceil(box.maxX));
  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      const object = map.objects[tileIndex(map, x, y)];
      if (object) addObject(ctx, state, camera, object, time, add);
      if (terrainId(state, x, y) === TERRAIN.water) {
        addRipples(ctx, camera, x, y, time, add);
      }
    }
  }

  for (const roof of map.roofs) {
    if (blocks(roof, camera, player)) continue;
    addRoof(ctx, camera, roof, add);
  }

  for (const item of state.groundItems) {
    const spot = project(camera, item.x + 0.5, item.y + 0.5, 0);
    add(spot, () => drawGroundItem(ctx, camera, item));
  }

  for (const npc of state.npcs) {
    if (npc.respawnTick !== null) continue;
    const spot = project(camera, npc.fx + 0.5, npc.fy + 0.5, 0);
    add(spot, () => drawNpcActor(ctx, camera, npc, time));
  }

  if (player.respawnTick === null) {
    const spot = project(camera, player.fx + 0.5, player.fy + 0.5, 0);
    add(spot, () => drawPlayer(ctx, camera, player, time));
  }

  drawables.sort((a, b) => b.depth - a.depth);
  for (const drawable of drawables) drawable.draw();
}

/** Light drifting across the water, which is all the motion Classic gave it. */
function addRipples(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  x: number,
  y: number,
  time: number,
  add: Add,
): void {
  const spot = project(camera, x + 0.5, y + 0.5, 0);
  if (spot.depth > 16) return;
  add(spot, () => {
    for (let i = 0; i < 2; i++) {
      const drift = (time / 2600 + hash2d(x, y, i)) % 1;
      const width = 0.25 + hash2d(x, y, i + 8) * 0.45;
      const left = x + hash2d(x, y, i + 24) * (1 - width);
      const top = y + drift * 0.92;
      ctx.fillStyle = i ? "rgba(0,0,0,0.10)" : "rgba(206,230,255,0.22)";
      ctx.beginPath();
      const corners = [
        [left, top],
        [left + width, top],
        [left + width, top + 0.08],
        [left, top + 0.08],
      ] as const;
      for (const [index, [cx, cy]] of corners.entries()) {
        const at = project(camera, cx, cy, 0.01);
        if (index === 0) ctx.moveTo(at.sx, at.sy);
        else ctx.lineTo(at.sx, at.sy);
      }
      ctx.closePath();
      ctx.fill();
    }
  });
}

/**
 * A roof lifts away when it stands between the camera and the player, which
 * covers being inside it, standing in its doorway, and being behind it — you
 * can always see yourself and the street you are on.
 */
function blocks(
  roof: Roof,
  from: { x: number; y: number },
  to: { x: number; y: number },
): boolean {
  const edge = ROOF_EAVE + 0.5;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  let near = 0;
  let far = 1;

  for (const [along, low, high] of [
    [dx, roof.x - edge - from.x, roof.x + roof.w + edge - from.x],
    [dy, roof.y - edge - from.y, roof.y + roof.h + edge - from.y],
  ] as const) {
    if (Math.abs(along) < 1e-9) {
      if (low > 0 || high < 0) return false;
      continue;
    }
    const a = low / along;
    const b = high / along;
    near = Math.max(near, Math.min(a, b));
    far = Math.min(far, Math.max(a, b));
    if (near > far) return false;
  }
  return true;
}

/* ----------------------------------------------------------------- models */

function addObject(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: Camera,
  object: WorldObject,
  time: number,
  add: Add,
): void {
  const art = getObjectDef(object.defId).art;
  const spot = project(camera, object.x + 0.5, object.y + 0.5, 0);

  switch (art.kind) {
    case "wall":
      add(spot, () => drawWall(ctx, state, camera, object, art, near(spot)));
      return;
    case "tree":
      add(spot, () => drawTree(ctx, camera, object, art, time));
      return;
    case "fence":
    case "gate":
      add(spot, () => drawFence(ctx, camera, object, art.kind));
      return;
    case "rock":
      add(spot, () => drawRock(ctx, camera, object, art.vein));
      return;
    case "table":
    case "counter":
    case "chest":
      add(spot, () => drawFurniture(ctx, camera, object, art));
      return;
    default:
      add(spot, () => {
        if (drawScenery(ctx, camera, art, object.x, object.y, time)) return;
        // The few kinds with no model yet stay flat sprites.
        ctx.globalAlpha = fogAt(camera, spot.depth);
        drawObjectArt(
          ctx,
          art,
          spot.sx,
          spot.sy,
          camera.focal / spot.depth,
          time,
          object.index,
        );
        ctx.globalAlpha = 1;
      });
  }
}

/**
 * Classic's walls stand on the edges between tiles, not across them, so a wall
 * is drawn as a thin slab running the way its neighbours run. A tile with
 * neighbours both ways gets both slabs, which turns the corner.
 */
const WALL_THICKNESS = 0.34;

/** Close enough for the mortar and the roof tiles to be worth ruling in. */
const DETAIL_TILES = 15;

function near(spot: Projected): boolean {
  return spot.depth < DETAIL_TILES;
}

function drawWall(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: Camera,
  object: WorldObject,
  art: Extract<ObjectArt, { kind: "wall" }>,
  detail: boolean,
): void {
  const { x, y } = object;
  const joined = (dx: number, dy: number) => {
    const at = state.map.objects[tileIndex(state.map, x + dx, y + dy)];
    if (!at) return false;
    const kind = getObjectDef(at.defId).art.kind;
    return kind === "wall" || kind === "gate";
  };
  const inset = (1 - WALL_THICKNESS) / 2;
  const eastWest = joined(-1, 0) || joined(1, 0);
  const northSouth = joined(0, -1) || joined(0, 1);

  // Ends butt into the next block of the run, so they are left unpainted.
  if (eastWest || !northSouth) {
    box(
      ctx,
      camera,
      x,
      y + inset,
      1,
      WALL_THICKNESS,
      0,
      WALL_HEIGHT,
      art.face,
      [true, true, !joined(-1, 0), !joined(1, 0)],
      detail ? 4 : 0,
    );
    window(ctx, camera, object, x, y + inset, 1, WALL_THICKNESS, true);
  }
  if (northSouth) {
    box(
      ctx,
      camera,
      x + inset,
      y,
      WALL_THICKNESS,
      1,
      0,
      WALL_HEIGHT,
      art.face,
      [!joined(0, -1), !joined(0, 1), true, true],
      detail ? 4 : 0,
    );
    window(ctx, camera, object, x + inset, y, WALL_THICKNESS, 1, false);
  }
}

/** A shuttered window on roughly every fourth block of a run. */
function window(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  object: WorldObject,
  x: number,
  y: number,
  w: number,
  d: number,
  alongX: boolean,
): void {
  if (object.index % 4 !== 1) return;
  const low = WALL_HEIGHT * 0.42;
  const high = WALL_HEIGHT * 0.74;
  const nudge = 0.02;

  if (alongX) {
    const wall = camera.y > y + d ? y + d + nudge : y - nudge;
    face(
      ctx,
      camera,
      [
        [x + 0.32, wall, low],
        [x + w - 0.32, wall, low],
        [x + w - 0.32, wall, high],
        [x + 0.32, wall, high],
      ],
      "#4a7ab0",
      1,
    );
    return;
  }
  const wall = camera.x > x + w ? x + w + nudge : x - nudge;
  face(
    ctx,
    camera,
    [
      [wall, y + 0.32, low],
      [wall, y + d - 0.32, low],
      [wall, y + d - 0.32, high],
      [wall, y + 0.32, high],
    ],
    "#4a7ab0",
    1,
  );
}

/**
 * A hipped roof, cut into cells no bigger than a tile. One plate for the whole
 * roof cannot be sorted against the walls and people around it — it either
 * swallowed them or hid behind them — so each cell is sorted on its own depth,
 * which also gives the roof its courses of tile for nothing.
 */
const ROOF_EAVE = 0.25;

/** How high the roof stands over a point on it, given its footprint. */
function roofHeight(roof: Roof, x: number, y: number): number {
  const low = WALL_HEIGHT;
  const rise = Math.min(2.4, Math.min(roof.w, roof.h) * 0.45 + 0.4);
  const run = Math.min(roof.w, roof.h) / 2 + ROOF_EAVE;
  const inX = Math.min(
    x - (roof.x - ROOF_EAVE),
    roof.x + roof.w + ROOF_EAVE - x,
  );
  const inY = Math.min(
    y - (roof.y - ROOF_EAVE),
    roof.y + roof.h + ROOF_EAVE - y,
  );
  return low + rise * Math.min(1, Math.max(0, Math.min(inX, inY) / run));
}

function addRoof(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  roof: Roof,
  add: Add,
): void {
  const x1 = roof.x - ROOF_EAVE;
  const x2 = roof.x + roof.w + ROOF_EAVE;
  const y1 = roof.y - ROOF_EAVE;
  const y2 = roof.y + roof.h + ROOF_EAVE;
  // Close up, halve the cells so the ridges and hips stop looking sawn.
  const centre = project(camera, roof.x + roof.w / 2, roof.y + roof.h / 2, 0);
  const per = centre.depth < DETAIL_TILES * 0.6 ? 2 : 1;
  const cols = Math.ceil((x2 - x1) * per);
  const rows = Math.ceil((y2 - y1) * per);
  const stepX = (x2 - x1) / cols;
  const stepY = (y2 - y1) / rows;
  // A touch of variation per building, so a street of roofs is not one slab.
  const tint = 0.92 + hash2d(roof.x, roof.y, 11) * 0.16;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const ax = x1 + col * stepX;
      const bx = ax + stepX;
      const ay = y1 + row * stepY;
      const by = ay + stepY;
      const corners: Vertex[] = [
        [ax, ay, roofHeight(roof, ax, ay)],
        [bx, ay, roofHeight(roof, bx, ay)],
        [bx, by, roofHeight(roof, bx, by)],
        [ax, by, roofHeight(roof, ax, by)],
      ];
      const spot = project(camera, (ax + bx) / 2, (ay + by) / 2, corners[0][2]);
      add(spot, () => {
        face(ctx, camera, corners, roof.colour, tint * slopeLightOf(corners));
      });
    }
  }
}

/** Shade a roof cell from the way it slopes, so ridges and hips show up. */
function slopeLightOf(corners: readonly Vertex[]): number {
  const [a, b, c, d] = corners;
  const fall = (a[2] + b[2] - c[2] - d[2]) / 2;
  const side = (a[2] + d[2] - b[2] - c[2]) / 2;
  // The light comes from the north west and above, as it does on the ground.
  return (
    0.78 +
    fall * 0.5 +
    side * 0.28 +
    (1 - Math.abs(fall) - Math.abs(side)) * 0.18
  );
}

/**
 * Classic's trees are a broad round crown on a short trunk, not a spike, so
 * the crown is built as stacked rings that bulge in the middle. Rings are
 * painted from the far side of the trunk forwards, which is all the sorting a
 * convex shape needs.
 */
const CROWN_BLADES = 6;
const CROWN_RINGS = [
  { radius: 0.5, height: 0.6 },
  { radius: 1, height: 1 },
  { radius: 0.78, height: 1.4 },
] as const;

function drawTree(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  object: WorldObject,
  art: Extract<ObjectArt, { kind: "tree" }>,
  time: number,
): void {
  const cx = object.x + 0.5;
  const cy = object.y + 0.5;
  const size = art.size;
  const sway = Math.sin(time / 1100 + object.index) * 0.04;
  const spread = 0.52 * size;

  box(ctx, camera, cx - 0.09, cy - 0.09, 0.18, 0.18, 0, 0.7 * size, art.trunk);

  // Far side of the crown first, wherever the camera happens to be standing.
  const toward = Math.atan2(camera.y - cy, camera.x - cx);
  const blades = Array.from({ length: CROWN_BLADES }, (_, i) => {
    const from = (i / CROWN_BLADES) * Math.PI * 2;
    const to = ((i + 1) / CROWN_BLADES) * Math.PI * 2;
    return { from, to, near: Math.cos((from + to) / 2 - toward) };
  }).sort((a, b) => a.near - b.near);

  const at = (angle: number, ring: number, lift: number) =>
    [
      cx + Math.cos(angle) * CROWN_RINGS[ring].radius * spread + sway,
      cy + Math.sin(angle) * CROWN_RINGS[ring].radius * spread + sway,
      CROWN_RINGS[ring].height * size + lift,
    ] as const;

  for (const [ring, blade] of blades.flatMap((blade) =>
    [0, 1].map((ring) => [ring, blade] as const),
  )) {
    const light = 0.74 + ((Math.sin(blade.from) + 1) / 2) * 0.34;
    face(
      ctx,
      camera,
      [
        at(blade.from, ring, 0),
        at(blade.to, ring, 0),
        at(blade.to, ring + 1, 0),
        at(blade.from, ring + 1, 0),
      ],
      ring === 0 ? art.canopyShade : art.canopy,
      light,
    );
  }
  for (const blade of blades) {
    face(
      ctx,
      camera,
      [
        at(blade.from, 2, 0),
        at(blade.to, 2, 0),
        [cx + sway, cy + sway, 1.68 * size],
      ],
      art.canopy,
      0.8 + ((Math.sin(blade.from) + 1) / 2) * 0.3,
    );
  }
}

function drawFence(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  object: WorldObject,
  kind: "fence" | "gate",
): void {
  const { x, y } = object;
  const colour = kind === "gate" ? "#6b4526" : "#7a5230";
  for (const at of [0.08, 0.82]) {
    box(ctx, camera, x + at, y + 0.44, 0.1, 0.1, 0, 0.8, colour);
  }
  if (kind === "gate") return;
  for (const height of [0.32, 0.58]) {
    box(ctx, camera, x, y + 0.46, 1, 0.06, height, height + 0.11, "#96683d");
  }
}

function drawRock(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  object: WorldObject,
  vein: string | null,
): void {
  const cx = object.x + 0.5;
  const cy = object.y + 0.5;
  const faces = 6;
  for (let i = 0; i < faces; i++) {
    const a = (i / faces) * Math.PI * 2;
    const b = ((i + 1) / faces) * Math.PI * 2;
    const ra = 0.32 + hash2d(object.x, object.y, i) * 0.12;
    const rb = 0.32 + hash2d(object.x, object.y, i + 1) * 0.12;
    face(
      ctx,
      camera,
      [
        [cx + Math.cos(a) * ra, cy + Math.sin(a) * ra, 0],
        [cx + Math.cos(b) * rb, cy + Math.sin(b) * rb, 0],
        [cx, cy, 0.66],
      ],
      vein && i % 3 === 0 ? vein : "#8d857c",
      0.76 + (i % 3) * 0.15,
    );
  }
}

function drawFurniture(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  object: WorldObject,
  art: Extract<ObjectArt, { kind: "table" | "counter" | "chest" }>,
): void {
  const colour = art.kind === "table" ? "#8a6136" : art.colour;
  const top = art.kind === "chest" ? 0.6 : 0.72;
  box(ctx, camera, object.x + 0.1, object.y + 0.1, 0.8, 0.8, 0, top, colour);
}

/* ------------------------------------------------------------- billboards */

function drawGroundItem(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  item: GroundItem,
): void {
  const spot = project(camera, item.x + 0.5, item.y + 0.5, 0);
  const size = (camera.focal / spot.depth) * 0.56;
  ctx.globalAlpha = fogAt(camera, spot.depth);
  drawItemIcon(ctx, item.id, spot.sx - size / 2, spot.sy - size, size);
  ctx.globalAlpha = 1;
}

function drawNpcActor(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  npc: Npc,
  time: number,
): void {
  const sprite = getNpcDef(npc.defId).sprite;
  const at = { x: npc.fx + 0.5, y: npc.fy + 0.5 };
  const phase = walkPhase(npc.path.length > 0, time);
  if (sprite.kind === "humanoid") {
    drawPerson(
      ctx,
      camera,
      at,
      {
        skin: sprite.skin,
        hair: sprite.hair,
        shirt: sprite.shirt,
        legs: sprite.legs,
        height: sprite.height,
      },
      npc.facing,
      phase,
    );
  } else if (sprite.kind === "beast") {
    drawBeast(ctx, camera, at, sprite, npc.facing, phase);
  } else {
    drawBird(ctx, camera, at, sprite, npc.facing, phase);
  }
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  player: Player,
  time: number,
): void {
  drawPerson(
    ctx,
    camera,
    { x: player.fx + 0.5, y: player.fy + 0.5 },
    playerLook(player),
    player.facing,
    walkPhase(player.path.length > 0, time),
  );
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

/* --------------------------------------------------------------- overlays */

function addHover(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  hover: Point,
  add: Add,
): void {
  const spot = project(camera, hover.x + 0.5, hover.y + 0.5, 0);
  add(spot, () => {
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const corners = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ] as const;
    for (const [index, [dx, dy]] of corners.entries()) {
      const at = project(camera, hover.x + dx, hover.y + dy, 0.02);
      if (index === 0) ctx.moveTo(at.sx, at.sy);
      else ctx.lineTo(at.sx, at.sy);
    }
    ctx.closePath();
    ctx.stroke();
  });
}

/**
 * The click marker the client drops where you asked to go: yellow for a walk,
 * red when there is something to do when you get there.
 */
function addMarker(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: Camera,
  time: number,
  add: Add,
): void {
  const marker = state.marker;
  if (!marker) return;
  // It holds while you walk, and flashes even when you were already there.
  const alive = time - marker.bornAt;
  if (!state.player.path.length && alive > 700) return;
  const spot = project(camera, marker.x + 0.5, marker.y + 0.5, 0.02);
  const tile = camera.focal / spot.depth;
  const age = Math.min(1, alive / 220);
  const arm = tile * (0.3 - 0.12 * age);

  const ink = marker.kind === "action" ? "#e02020" : "#ffe14a";

  add(spot, () => {
    ctx.lineCap = "round";
    for (const [colour, width] of [
      ["rgba(0,0,0,0.7)", Math.max(3, tile / 7)],
      [ink, Math.max(1.5, tile / 12)],
    ] as const) {
      ctx.strokeStyle = colour;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(spot.sx - arm, spot.sy - arm);
      ctx.lineTo(spot.sx + arm, spot.sy + arm);
      ctx.moveTo(spot.sx + arm, spot.sy - arm);
      ctx.lineTo(spot.sx - arm, spot.sy + arm);
      ctx.stroke();
    }
    ctx.lineCap = "butt";
  });
}

/**
 * Names, health bars and hitsplats go on at full resolution, so they stay
 * sharp over the chunky world behind them.
 */
function drawLabels(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: Camera,
  view: Viewport,
  time: number,
): void {
  const { player } = state;
  const place = (x: number, y: number) => {
    const spot = project(camera, x, y, 0);
    return {
      sx: spot.sx / view.scale,
      sy: spot.sy / view.scale,
      tile: camera.focal / spot.depth / view.scale,
      depth: spot.depth,
    };
  };

  for (const npc of state.npcs) {
    if (npc.respawnTick !== null) continue;
    const at = place(npc.fx + 0.5, npc.fy + 0.5);
    if (at.depth <= 0.5 || at.depth > DRAW_DISTANCE) continue;
    if (npc.hitpoints < npc.maxHitpoints) {
      drawHealthBar(
        ctx,
        at.sx,
        at.sy - at.tile * 1.35,
        at.tile,
        npc.hitpoints / npc.maxHitpoints,
      );
    }
    if (npc.targetPlayer) {
      drawLabel(
        ctx,
        at.sx,
        at.sy - at.tile * 1.6,
        getNpcDef(npc.defId).name,
        "#ff9a3c",
      );
    }
  }

  if (player.respawnTick === null) {
    const at = place(player.fx + 0.5, player.fy + 0.5);
    drawLabel(ctx, at.sx, at.sy - at.tile * 1.55, player.name, "#ffffff");
    if (player.hitpoints < player.maxHitpoints) {
      drawHealthBar(
        ctx,
        at.sx,
        at.sy - at.tile * 1.38,
        at.tile,
        player.hitpoints / player.maxHitpoints,
      );
    }
  }

  ctx.textAlign = "center";
  for (const splat of state.splats) {
    const age = (time - splat.bornAt) / 1200;
    if (age < 0 || age > 1) continue;
    const at = place(splat.x + 0.5, splat.y + 0.5);
    if (at.depth <= 0.5) continue;
    const scale = Math.max(0.8, at.tile / 34);
    const y = at.sy - at.tile * 0.95 - age * 18 * scale;
    ctx.globalAlpha = 1 - age * age;

    if (splat.tone === "damage" || splat.tone === "block") {
      ctx.fillStyle = splat.tone === "damage" ? "#c02020" : "#2f4f8f";
      ctx.beginPath();
      ctx.arc(at.sx, y, 9 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.round(11 * scale)}px 'Helvetica Neue', Arial, sans-serif`;
      ctx.fillText(splat.text, at.sx, y + 4 * scale);
    } else {
      ctx.fillStyle = splat.tone === "level" ? "#ffe14a" : "#8ce87a";
      ctx.font = `bold ${Math.round(12 * scale)}px 'Helvetica Neue', Arial, sans-serif`;
      ctx.strokeStyle = "rgba(0,0,0,0.7)";
      ctx.lineWidth = 3 * scale;
      ctx.strokeText(splat.text, at.sx, y);
      ctx.fillText(splat.text, at.sx, y);
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
  const width = Math.max(18, tile * 0.88);
  const height = Math.max(3, width / 8);
  ctx.fillStyle = "#7a1414";
  ctx.fillRect(x - width / 2, y, width, height);
  ctx.fillStyle = "#3fbf3f";
  ctx.fillRect(x - width / 2, y, Math.max(0, width * fraction), height);
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  colour: string,
): void {
  ctx.font = "13px 'Helvetica Neue', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.strokeStyle = "rgba(0,0,0,0.75)";
  ctx.lineWidth = 4;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = colour;
  ctx.fillText(text, x, y);
}

/* ---------------------------------------------------------------- helpers */

function walkPhase(moving: boolean, time: number): number {
  return moving ? (time / 90) % (Math.PI * 2) : 0;
}
