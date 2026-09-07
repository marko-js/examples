/** Draws the round minimap: terrain colours, scenery, items, and NPC dots. */
import { MINIMAP_SCALE, MINIMAP_SIZE } from "../config";
import { getNpcDef } from "../npcs";
import type { GameState } from "../state";
import {
  getObjectDef,
  TERRAIN_DEFS,
  type TerrainId,
  tileIndex,
} from "../world";

const RADIUS = MINIMAP_SIZE / 2;
const TILES = MINIMAP_SIZE / MINIMAP_SCALE;

/** World tile under a point on the minimap surface. */
export function minimapTileAt(
  state: GameState,
  x: number,
  y: number,
): { x: number; y: number } {
  const originX = state.player.fx - TILES / 2;
  const originY = state.player.fy - TILES / 2;
  return {
    x: Math.floor(originX + x / MINIMAP_SCALE),
    y: Math.floor(originY + y / MINIMAP_SCALE),
  };
}

export function renderMinimap(
  ctx: CanvasRenderingContext2D,
  state: GameState,
): void {
  const { map, player } = state;
  ctx.clearRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);
  ctx.save();
  ctx.beginPath();
  ctx.arc(RADIUS, RADIUS, RADIUS - 2, 0, Math.PI * 2);
  ctx.clip();

  const originX = player.fx - TILES / 2;
  const originY = player.fy - TILES / 2;

  for (let y = 0; y <= TILES; y++) {
    for (let x = 0; x <= TILES; x++) {
      const tx = Math.floor(originX) + x;
      const ty = Math.floor(originY) + y;
      const sx = (tx - originX) * MINIMAP_SCALE;
      const sy = (ty - originY) * MINIMAP_SCALE;
      if (tx < 0 || ty < 0 || tx >= map.size || ty >= map.size) {
        ctx.fillStyle = "#16324f";
        ctx.fillRect(sx, sy, MINIMAP_SCALE, MINIMAP_SCALE);
        continue;
      }
      const index = tileIndex(map, tx, ty);
      ctx.fillStyle = TERRAIN_DEFS[map.terrain[index] as TerrainId].minimap;
      ctx.fillRect(sx, sy, MINIMAP_SCALE, MINIMAP_SCALE);

      const object = map.objects[index];
      if (object) {
        const colour = objectColour(object.defId);
        if (colour) {
          ctx.fillStyle = colour;
          ctx.fillRect(sx, sy, MINIMAP_SCALE, MINIMAP_SCALE);
        }
      }
    }
  }

  for (const item of state.groundItems)
    dot(ctx, originX, originY, item.x, item.y, "#e03c3c");
  for (const npc of state.npcs) {
    if (npc.respawnTick !== null) continue;
    const def = getNpcDef(npc.defId);
    dot(
      ctx,
      originX,
      originY,
      npc.fx,
      npc.fy,
      def.attackable ? "#e8d24a" : "#4ad2e8",
    );
  }
  dot(ctx, originX, originY, player.fx, player.fy, "#ffffff");

  ctx.restore();

  ctx.strokeStyle = "#2b2b2b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(RADIUS, RADIUS, RADIUS - 2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#e8d24a";
  ctx.font = "bold 10px 'Helvetica Neue', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("N", RADIUS, 12);
}

function dot(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  x: number,
  y: number,
  colour: string,
): void {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(
    (x - originX) * MINIMAP_SCALE,
    (y - originY) * MINIMAP_SCALE,
    2.4,
    0,
    Math.PI * 2,
  );
  ctx.fill();
}

function objectColour(defId: string): string | null {
  if (defId.startsWith("rock_")) return "#9a938c";
  if (defId.startsWith("fish_")) return "#7fd8f0";
  const art = getObjectDef(defId).art;
  switch (art.kind) {
    case "tree":
    case "bush":
      return art.kind === "tree" ? art.canopy : art.colour;
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
