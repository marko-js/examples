/** Draws the game view: terrain, scenery, actors, and the overlays above them. */
import { TILE_SIZE, VIEW_HEIGHT, VIEW_WIDTH } from "../config";
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

const EDGES = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
] as const;

const TILES_X = VIEW_WIDTH / TILE_SIZE;
const TILES_Y = VIEW_HEIGHT / TILE_SIZE;

export function cameraFor(state: GameState): Camera {
  const { player, map } = state;
  return {
    x: clamp(player.fx + 0.5 - TILES_X / 2, 0, map.size - TILES_X),
    y: clamp(player.fy + 0.5 - TILES_Y / 2, 0, map.size - TILES_Y),
  };
}

export function tileAtScreen(
  camera: Camera,
  screenX: number,
  screenY: number,
): Point {
  return {
    x: Math.floor(camera.x + screenX / TILE_SIZE),
    y: Math.floor(camera.y + screenY / TILE_SIZE),
  };
}

export function renderWorld(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  time: number,
  hover: Point | null,
): void {
  const camera = cameraFor(state);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  const minX = Math.floor(camera.x) - 1;
  const minY = Math.floor(camera.y) - 1;
  const maxX = Math.ceil(camera.x + TILES_X) + 1;
  const maxY = Math.ceil(camera.y + TILES_Y) + 2;

  drawTerrain(ctx, state, camera, time, minX, minY, maxX, maxY);
  drawFlatObjects(ctx, state, camera, time, minX, minY, maxX, maxY);
  drawDestination(ctx, state, camera, time);
  if (hover) drawHover(ctx, camera, hover);
  drawSortedLayer(ctx, state, camera, time, minX, minY, maxX, maxY);
  drawSplats(ctx, state, camera, time);
}

/* -------------------------------------------------------------- terrain */

function drawTerrain(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: Camera,
  time: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): void {
  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      const id = terrainId(state, x, y);
      const def = TERRAIN_DEFS[id];
      const sx = Math.round((x - camera.x) * TILE_SIZE);
      const sy = Math.round((y - camera.y) * TILE_SIZE);

      ctx.fillStyle = def.colour;
      ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

      if (id === TERRAIN.water) {
        drawWater(ctx, sx, sy, x, y, time);
      } else {
        drawTexture(ctx, sx, sy, x, y, def.speckle);
      }

      if (id === TERRAIN.bridge) drawPlanks(ctx, sx, sy);
      blendEdges(ctx, state, x, y, sx, sy, id);
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
  speckle: string,
): void {
  ctx.fillStyle = "rgba(0,0,0,0.07)";
  for (let i = 0; i < 2; i++) {
    const w = 6 + ((hash2d(x, y, i + 32) * 9) | 0);
    const h = 4 + ((hash2d(x, y, i + 34) * 7) | 0);
    const ox = (hash2d(x, y, i + 36) * (TILE_SIZE - w)) | 0;
    const oy = (hash2d(x, y, i + 38) * (TILE_SIZE - h)) | 0;
    ctx.fillRect(sx + ox, sy + oy, w, h);
  }

  ctx.fillStyle = speckle;
  for (let i = 0; i < 5; i++) {
    const ox = (hash2d(x, y, i) * (TILE_SIZE - 4)) | 0;
    const oy = (hash2d(x, y, i + 16) * (TILE_SIZE - 4)) | 0;
    ctx.fillRect(sx + ox, sy + oy, 3, 3);
  }
}

function drawWater(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  x: number,
  y: number,
  time: number,
): void {
  for (let i = 0; i < 2; i++) {
    const drift = (time / 2600 + hash2d(x, y, i)) % 1;
    const ry = sy + Math.round(drift * TILE_SIZE);
    const width = 8 + Math.round(hash2d(x, y, i + 8) * 14);
    const offset = Math.round(hash2d(x, y, i + 24) * (TILE_SIZE - width));
    ctx.fillStyle = i ? "rgba(0,0,0,0.10)" : "rgba(200,228,255,0.13)";
    ctx.fillRect(sx + offset, ry, width, 2);
  }
}

function drawPlanks(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
): void {
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  for (let i = 4; i < TILE_SIZE; i += 8) ctx.fillRect(sx, sy + i, TILE_SIZE, 1);
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
  id: TerrainId,
): void {
  for (const [edge, [dx, dy]] of EDGES.entries()) {
    const neighbour = terrainId(state, x + dx, y + dy);
    if (neighbour === id) continue;

    if (id === TERRAIN.water) {
      ctx.fillStyle = "rgba(206,230,255,0.32)";
      fillEdge(ctx, sx, sy, dx, dy, 3);
      continue;
    }
    if (neighbour === TERRAIN.water) continue;

    ctx.fillStyle = TERRAIN_DEFS[neighbour].colour;
    const steps = 4;
    const span = TILE_SIZE / steps;
    for (let step = 0; step < steps; step++) {
      const depth = 2 + Math.round(hash2d(x, y, edge * 8 + step) * 6);
      const offset = step * span;
      if (dy === -1) ctx.fillRect(sx + offset, sy, span, depth);
      else if (dy === 1)
        ctx.fillRect(sx + offset, sy + TILE_SIZE - depth, span, depth);
      else if (dx === -1) ctx.fillRect(sx, sy + offset, depth, span);
      else ctx.fillRect(sx + TILE_SIZE - depth, sy + offset, depth, span);
    }
  }
}

function fillEdge(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  dx: number,
  dy: number,
  depth: number,
): void {
  if (dy === -1) ctx.fillRect(sx, sy, TILE_SIZE, depth);
  else if (dy === 1) ctx.fillRect(sx, sy + TILE_SIZE - depth, TILE_SIZE, depth);
  else if (dx === -1) ctx.fillRect(sx, sy, depth, TILE_SIZE);
  else ctx.fillRect(sx + TILE_SIZE - depth, sy, depth, TILE_SIZE);
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
  time: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): void {
  forEachObject(state, minX, minY, maxX, maxY, (object) => {
    const def = getObjectDef(object.defId);
    if (!def.flat) return;
    const { sx, sy } = project(camera, object.x, object.y);
    drawObjectArt(ctx, def.art, sx, sy, TILE_SIZE, time);
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
  time: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): void {
  const drawables: Drawable[] = [];

  forEachObject(state, minX, minY, maxX, maxY, (object) => {
    const def = getObjectDef(object.defId);
    if (def.flat) return;
    const { sx, sy } = project(camera, object.x, object.y);
    drawables.push({
      sort: object.y,
      draw: () => drawObjectArt(ctx, def.art, sx, sy, TILE_SIZE, time),
    });
  });

  for (const item of state.groundItems) {
    if (item.x < minX || item.x > maxX || item.y < minY || item.y > maxY)
      continue;
    drawables.push({
      sort: item.y - 0.4,
      draw: () => drawGroundItem(ctx, camera, item),
    });
  }

  for (const npc of state.npcs) {
    if (npc.respawnTick !== null) continue;
    if (npc.x < minX || npc.x > maxX || npc.y < minY || npc.y > maxY) continue;
    drawables.push({
      sort: npc.fy,
      draw: () => drawNpcActor(ctx, camera, npc, time),
    });
  }

  if (state.player.respawnTick === null) {
    drawables.push({
      sort: state.player.fy,
      draw: () => drawPlayer(ctx, camera, state.player, time),
    });
  }

  drawables.sort((a, b) => a.sort - b.sort);
  for (const drawable of drawables) drawable.draw();
}

function drawGroundItem(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  item: GroundItem,
): void {
  const { sx, sy } = project(camera, item.x, item.y);
  drawItemIcon(ctx, item.id, sx - 9, sy - 20, 18);
}

function drawNpcActor(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  npc: Npc,
  time: number,
): void {
  const def = getNpcDef(npc.defId);
  const { sx, sy } = projectFloat(camera, npc.fx, npc.fy);
  drawNpc(
    ctx,
    sx,
    sy,
    TILE_SIZE,
    def.sprite,
    npc.facing,
    walkPhase(npc.path.length > 0, time),
  );
  if (npc.hits < npc.maxHits)
    drawHealthBar(ctx, sx, sy - TILE_SIZE * 1.3, npc.hits / npc.maxHits);
  if (npc.targetPlayer)
    drawLabel(ctx, sx, sy - TILE_SIZE * 1.55, def.name, "#ff9a3c");
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  player: Player,
  time: number,
): void {
  const { sx, sy } = projectFloat(camera, player.fx, player.fy);
  drawCharacter(
    ctx,
    sx,
    sy,
    TILE_SIZE,
    playerLook(player),
    player.facing,
    walkPhase(player.path.length > 0, time),
  );
  drawLabel(ctx, sx, sy - TILE_SIZE * 1.5, player.name, "#ffffff");
  if (player.hits < player.maxHits)
    drawHealthBar(ctx, sx, sy - TILE_SIZE * 1.32, player.hits / player.maxHits);
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

function drawDestination(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: Camera,
  time: number,
): void {
  const path = state.player.path;
  if (!path.length) return;
  const goal = path[path.length - 1];
  const { sx, sy } = project(camera, goal.x, goal.y);
  const pulse = 5 + Math.sin(time / 120) * 1.5;
  ctx.strokeStyle = "#ffe14a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx - pulse, sy - TILE_SIZE / 2 - pulse);
  ctx.lineTo(sx + pulse, sy - TILE_SIZE / 2 + pulse);
  ctx.moveTo(sx + pulse, sy - TILE_SIZE / 2 - pulse);
  ctx.lineTo(sx - pulse, sy - TILE_SIZE / 2 + pulse);
  ctx.stroke();
}

function drawHover(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  hover: Point,
): void {
  const sx = Math.round((hover.x - camera.x) * TILE_SIZE);
  const sy = Math.round((hover.y - camera.y) * TILE_SIZE);
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(sx + 0.5, sy + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
}

function drawSplats(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: Camera,
  time: number,
): void {
  ctx.textAlign = "center";
  for (const splat of state.splats) {
    const age = (time - splat.bornAt) / 1200;
    if (age < 0 || age > 1) continue;
    const { sx, sy } = projectFloat(camera, splat.x, splat.y);
    const y = sy - TILE_SIZE * 0.9 - age * 18;
    ctx.globalAlpha = 1 - age * age;

    if (splat.tone === "damage" || splat.tone === "block") {
      ctx.fillStyle = splat.tone === "damage" ? "#c02020" : "#2f4f8f";
      ctx.beginPath();
      ctx.arc(sx, y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px 'Helvetica Neue', Arial, sans-serif";
      ctx.fillText(splat.text, sx, y + 4);
    } else {
      ctx.fillStyle = splat.tone === "level" ? "#ffe14a" : "#8ce87a";
      ctx.font = "bold 12px 'Helvetica Neue', Arial, sans-serif";
      ctx.strokeStyle = "rgba(0,0,0,0.7)";
      ctx.lineWidth = 3;
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
  fraction: number,
): void {
  const width = 28;
  ctx.fillStyle = "#7a1414";
  ctx.fillRect(x - width / 2, y, width, 4);
  ctx.fillStyle = "#3fbf3f";
  ctx.fillRect(x - width / 2, y, Math.max(0, width * fraction), 4);
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  colour: string,
): void {
  ctx.font = "10px 'Helvetica Neue', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.strokeStyle = "rgba(0,0,0,0.75)";
  ctx.lineWidth = 3;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = colour;
  ctx.fillText(text, x, y);
}

/* --------------------------------------------------------------- helpers */

function forEachObject(
  state: GameState,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  visit: (object: WorldObject) => void,
): void {
  const { map } = state;
  for (let y = Math.max(0, minY); y < Math.min(map.size, maxY); y++) {
    for (let x = Math.max(0, minX); x < Math.min(map.size, maxX); x++) {
      const object = map.objects[tileIndex(map, x, y)];
      if (object) visit(object);
    }
  }
}

/** Screen position of the bottom centre of a tile. */
function project(
  camera: Camera,
  x: number,
  y: number,
): { sx: number; sy: number } {
  return {
    sx: Math.round((x - camera.x) * TILE_SIZE + TILE_SIZE / 2),
    sy: Math.round((y - camera.y) * TILE_SIZE + TILE_SIZE),
  };
}

function projectFloat(
  camera: Camera,
  x: number,
  y: number,
): { sx: number; sy: number } {
  return {
    sx: (x - camera.x) * TILE_SIZE + TILE_SIZE / 2,
    sy: (y - camera.y) * TILE_SIZE + TILE_SIZE,
  };
}

function walkPhase(moving: boolean, time: number): number {
  return moving ? (time / 90) % (Math.PI * 2) : 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
