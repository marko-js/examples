/** Draws the round minimap: terrain colours, scenery, items, and NPC dots. */
import { MINIMAP_TILES } from "../config";
import { getNpcDef } from "../npcs";
import type { GameState } from "../state";
import {
  getObjectDef,
  TERRAIN_DEFS,
  type TerrainId,
  tileIndex,
} from "../world";

/** World tile under a point on a minimap of the given size, in CSS pixels. */
export function minimapTileAt(
  state: GameState,
  size: number,
  x: number,
  y: number,
): { x: number; y: number } {
  const scale = size / MINIMAP_TILES;
  return {
    x: Math.floor(state.player.fx - MINIMAP_TILES / 2 + x / scale),
    y: Math.floor(state.player.fy - MINIMAP_TILES / 2 + y / scale),
  };
}

export function renderMinimap(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  size: number,
): void {
  const { map, player } = state;
  const scale = size / MINIMAP_TILES;
  const radius = size / 2;
  const originX = player.fx - MINIMAP_TILES / 2;
  const originY = player.fy - MINIMAP_TILES / 2;

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.beginPath();
  ctx.arc(radius, radius, radius - 1, 0, Math.PI * 2);
  ctx.clip();

  for (let y = 0; y <= MINIMAP_TILES; y++) {
    for (let x = 0; x <= MINIMAP_TILES; x++) {
      const tx = Math.floor(originX) + x;
      const ty = Math.floor(originY) + y;
      const sx = (tx - originX) * scale;
      const sy = (ty - originY) * scale;
      if (tx < 0 || ty < 0 || tx >= map.size || ty >= map.size) {
        ctx.fillStyle = "#16324f";
        ctx.fillRect(sx, sy, scale + 1, scale + 1);
        continue;
      }
      const index = tileIndex(map, tx, ty);
      ctx.fillStyle = TERRAIN_DEFS[map.terrain[index] as TerrainId].minimap;
      ctx.fillRect(sx, sy, scale + 1, scale + 1);

      const object = map.objects[index];
      const colour = object && objectColour(object.defId);
      if (colour) {
        ctx.fillStyle = colour;
        ctx.fillRect(sx, sy, scale + 1, scale + 1);
      }
    }
  }

  const dotSize = Math.max(2, scale * 0.9);
  for (const item of state.groundItems) {
    dot(ctx, originX, originY, scale, item.x, item.y, dotSize, "#e03c3c");
  }
  for (const npc of state.npcs) {
    if (npc.respawnTick !== null) continue;
    const def = getNpcDef(npc.defId);
    const colour = def.attackable ? "#e8d24a" : "#4ad2e8";
    dot(ctx, originX, originY, scale, npc.fx, npc.fy, dotSize, colour);
  }
  dot(
    ctx,
    originX,
    originY,
    scale,
    player.fx,
    player.fy,
    dotSize * 1.2,
    "#ffffff",
  );

  ctx.restore();

  ctx.fillStyle = "#e8d24a";
  ctx.font = `bold ${Math.round(size / 13)}px 'Helvetica Neue', Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("N", radius, size / 9);
}

function dot(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  scale: number,
  x: number,
  y: number,
  size: number,
  colour: string,
): void {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc((x - originX) * scale, (y - originY) * scale, size, 0, Math.PI * 2);
  ctx.fill();
}

function objectColour(defId: string): string | null {
  if (defId.startsWith("rock_")) return "#9a938c";
  if (defId.startsWith("fish_")) return "#7fd8f0";
  const art = getObjectDef(defId).art;
  switch (art.kind) {
    case "tree":
      return art.canopy;
    case "bush":
      return art.colour;
    case "wall":
      return "#c8c8c0";
    case "fence":
    case "gate":
      return "#8a6136";
    case "chest":
      return "#f0c93f";
    case "counter":
      return "#f0a03f";
    case "fire":
      return "#f2a33c";
    default:
      return null;
  }
}
