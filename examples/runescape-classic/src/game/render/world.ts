/** Draws the game view: terrain, scenery, actors, and the overlays above them. */
import { tileSizeFor } from "../config";
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
  return {
    width,
    height,
    tile: tileSizeFor(width, height),
    focus: {
      x: (visible?.width ?? width) / 2,
      y: (visible?.height ?? height) / 2,
    },
  };
}

export function cameraFor(state: GameState, view: Viewport): Camera {
  const { player, map } = state;
  const acrossX = view.width / view.tile;
  const acrossY = view.height / view.tile;
  return {
    x: clamp(
      player.fx + 0.5 - view.focus.x / view.tile,
      0,
      Math.max(0, map.size - acrossX),
    ),
    y: clamp(
      player.fy + 0.5 - view.focus.y / view.tile,
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
    y: Math.floor(camera.y + screenY / view.tile),
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
    maxY: Math.ceil(camera.y + view.height / view.tile) + 2,
  };

  drawTerrain(ctx, state, camera, view, time, bounds);
  drawFlatObjects(ctx, state, camera, view, time, bounds);
  drawDestination(ctx, state, camera, view, time);
  if (hover) drawHover(ctx, camera, view, hover);
  drawSortedLayer(ctx, state, camera, view, time, bounds);
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
  const tile = view.tile;
  for (let y = bounds.minY; y < bounds.maxY; y++) {
    for (let x = bounds.minX; x < bounds.maxX; x++) {
      const id = terrainId(state, x, y);
      const def = TERRAIN_DEFS[id];
      const sx = Math.round((x - camera.x) * tile);
      const sy = Math.round((y - camera.y) * tile);

      ctx.fillStyle = def.colour;
      ctx.fillRect(sx, sy, tile, tile);

      if (id === TERRAIN.water) {
        drawWater(ctx, sx, sy, x, y, tile, time);
      } else {
        drawTexture(ctx, sx, sy, x, y, tile, def.speckle);
      }

      if (id === TERRAIN.bridge || id === TERRAIN.woodFloor) {
        drawPlanks(ctx, sx, sy, tile);
      }
      if (id === TERRAIN.stoneFloor) drawFlagstones(ctx, sx, sy, tile);
      blendEdges(ctx, state, x, y, sx, sy, tile, id);
    }
  }
}

/** Speckle and soft patches so a flat colour still reads as ground. */
function drawTexture(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  x: number,
  y: number,
  tile: number,
  speckle: string,
): void {
  const unit = tile / 32;
  ctx.fillStyle = "rgba(0,0,0,0.07)";
  for (let i = 0; i < 2; i++) {
    const w = (6 + ((hash2d(x, y, i + 32) * 9) | 0)) * unit;
    const h = (4 + ((hash2d(x, y, i + 34) * 7) | 0)) * unit;
    ctx.fillRect(
      sx + hash2d(x, y, i + 36) * (tile - w),
      sy + hash2d(x, y, i + 38) * (tile - h),
      w,
      h,
    );
  }

  const speck = Math.max(2, Math.round(3 * unit));
  ctx.fillStyle = speckle;
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(
      sx + ((hash2d(x, y, i) * (tile - speck)) | 0),
      sy + ((hash2d(x, y, i + 16) * (tile - speck)) | 0),
      speck,
      speck,
    );
  }
}

function drawWater(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  x: number,
  y: number,
  tile: number,
  time: number,
): void {
  const unit = tile / 32;
  for (let i = 0; i < 2; i++) {
    const drift = (time / 2600 + hash2d(x, y, i)) % 1;
    const width = (8 + Math.round(hash2d(x, y, i + 8) * 14)) * unit;
    ctx.fillStyle = i ? "rgba(0,0,0,0.10)" : "rgba(200,228,255,0.13)";
    ctx.fillRect(
      sx + hash2d(x, y, i + 24) * (tile - width),
      sy + Math.round(drift * tile),
      width,
      Math.max(1, 2 * unit),
    );
  }
}

function drawPlanks(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  tile: number,
): void {
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  const gap = tile / 4;
  for (let i = gap / 2; i < tile; i += gap) {
    ctx.fillRect(sx, sy + Math.round(i), tile, 1);
  }
}

function drawFlagstones(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  tile: number,
): void {
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(sx, sy, tile, 1);
  ctx.fillRect(sx, sy, 1, tile);
}

/**
 * Feather the seam where two terrains meet so tiles do not read as squares.
 * Water keeps its own edge instead, drawn as a line of surf against the shore.
 */
function blendEdges(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  x: number,
  y: number,
  sx: number,
  sy: number,
  tile: number,
  id: TerrainId,
): void {
  const unit = tile / 32;
  for (const [edge, [dx, dy]] of EDGES.entries()) {
    const neighbour = terrainId(state, x + dx, y + dy);
    if (neighbour === id) continue;

    if (id === TERRAIN.water) {
      ctx.fillStyle = "rgba(206,230,255,0.32)";
      fillEdge(ctx, sx, sy, tile, dx, dy, Math.max(2, 3 * unit));
      continue;
    }
    if (neighbour === TERRAIN.water) continue;

    ctx.fillStyle = TERRAIN_DEFS[neighbour].colour;
    const steps = 4;
    const span = tile / steps;
    for (let step = 0; step < steps; step++) {
      const depth = (2 + Math.round(hash2d(x, y, edge * 8 + step) * 6)) * unit;
      const offset = step * span;
      if (dy === -1) ctx.fillRect(sx + offset, sy, span, depth);
      else if (dy === 1)
        ctx.fillRect(sx + offset, sy + tile - depth, span, depth);
      else if (dx === -1) ctx.fillRect(sx, sy + offset, depth, span);
      else ctx.fillRect(sx + tile - depth, sy + offset, depth, span);
    }
  }
}

function fillEdge(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  tile: number,
  dx: number,
  dy: number,
  depth: number,
): void {
  if (dy === -1) ctx.fillRect(sx, sy, tile, depth);
  else if (dy === 1) ctx.fillRect(sx, sy + tile - depth, tile, depth);
  else if (dx === -1) ctx.fillRect(sx, sy, depth, tile);
  else ctx.fillRect(sx + tile - depth, sy, depth, tile);
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
    drawObjectArt(ctx, def.art, sx, sy, view.tile, time);
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
      draw: () => drawObjectArt(ctx, def.art, sx, sy, view.tile, time),
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
  const arm = view.tile * (0.34 - 0.14 * age) + Math.sin(time / 150) * 0.6;
  const cy = sy - view.tile / 2;

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
  const sy = Math.round((hover.y - camera.y) * view.tile);
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(sx + 0.5, sy + 0.5, view.tile - 1, view.tile - 1);
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
    sy: Math.round((y - camera.y) * view.tile + view.tile),
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
    sy: (y - camera.y) * view.tile + view.tile,
  };
}

function walkPhase(moving: boolean, time: number): number {
  return moving ? (time / 90) % (Math.PI * 2) : 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
