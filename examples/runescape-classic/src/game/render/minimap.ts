/**
 * The minimap: terrain, dots for anything that moves, and the little circular
 * icons the Classic world map used to mark banks, shops, mines and altars.
 */
import { MINIMAP_TILES } from "../config";
import { getNpcDef } from "../npcs";
import type { GameState } from "../state";
import {
  getObjectDef,
  TERRAIN_DEFS,
  type TerrainId,
  tileIndex,
  type WorldObject,
} from "../world";

/** World tile under a point on a minimap of the given size, in CSS pixels. */
export function minimapTileAt(
  state: GameState,
  size: number,
  x: number,
  y: number,
  yaw = 0,
): { x: number; y: number } {
  const scale = size / MINIMAP_TILES;
  const sin = Math.sin(yaw);
  const cos = Math.cos(yaw);
  const across = (x - size / 2) / scale;
  const down = (y - size / 2) / scale;
  return {
    x: Math.floor(state.player.fx + across * cos - down * sin),
    y: Math.floor(state.player.fy + across * sin + down * cos),
  };
}

/**
 * The map turns with the camera, so what is ahead of you is at the top of it.
 * The terrain is drawn through a rotated transform; everything with a face —
 * the icons, the dots, the marker — is placed by hand so it stays upright.
 */
export function renderMinimap(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  size: number,
  yaw = 0,
): void {
  const { map, player } = state;
  const scale = size / MINIMAP_TILES;
  const radius = size / 2;
  const originX = player.fx - MINIMAP_TILES / 2;
  const originY = player.fy - MINIMAP_TILES / 2;
  const sin = Math.sin(yaw);
  const cos = Math.cos(yaw);
  /** A world point on the turned map, in minimap pixels. */
  const at = (x: number, y: number) => {
    const dx = (x - player.fx) * scale;
    const dy = (y - player.fy) * scale;
    return {
      x: radius + dx * cos + dy * sin,
      y: radius - dx * sin + dy * cos,
    };
  };

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.beginPath();
  ctx.arc(radius, radius, radius - 1, 0, Math.PI * 2);
  ctx.clip();

  ctx.save();
  ctx.translate(radius, radius);
  ctx.rotate(-yaw);
  ctx.translate(-radius, -radius);
  // A turned square needs its diagonal covered, so the grid runs wider.
  const reach = Math.ceil(MINIMAP_TILES * 0.23);
  const flat = (x: number, y: number) => ({
    x: (x - originX) * scale,
    y: (y - originY) * scale,
  });
  for (let y = -reach; y <= MINIMAP_TILES + reach; y++) {
    for (let x = -reach; x <= MINIMAP_TILES + reach; x++) {
      const tx = Math.floor(originX) + x;
      const ty = Math.floor(originY) + y;
      const spot = flat(tx, ty);
      if (tx < 0 || ty < 0 || tx >= map.size || ty >= map.size) {
        ctx.fillStyle = "#16324f";
        ctx.fillRect(spot.x, spot.y, scale + 1, scale + 1);
        continue;
      }
      const index = tileIndex(map, tx, ty);
      ctx.fillStyle = TERRAIN_DEFS[map.terrain[index] as TerrainId].minimap;
      ctx.fillRect(spot.x, spot.y, scale + 1, scale + 1);

      const object = map.objects[index];
      const colour = object && objectColour(object.defId);
      if (colour) {
        ctx.fillStyle = colour;
        ctx.fillRect(spot.x, spot.y, scale + 1, scale + 1);
      }
    }
  }
  ctx.restore();

  drawIcons(ctx, state, at, scale);

  if (state.marker && player.path.length) {
    const spot = at(state.marker.x + 0.5, state.marker.y + 0.5);
    cross(ctx, spot.x, spot.y, Math.max(3, scale * 1.4));
  }

  const dotSize = Math.max(2, scale * 0.9);
  for (const item of state.groundItems) {
    dot(ctx, at(item.x + 0.5, item.y + 0.5), dotSize, "#e03c3c");
  }
  for (const npc of state.npcs) {
    if (npc.respawnTick !== null) continue;
    const def = getNpcDef(npc.defId);
    const colour = def.attackable ? "#e8d24a" : "#4ad2e8";
    dot(ctx, at(npc.fx + 0.5, npc.fy + 0.5), dotSize, colour);
  }
  dot(ctx, at(player.fx + 0.5, player.fy + 0.5), dotSize * 1.2, "#ffffff");

  ctx.restore();

  drawFrame(ctx, size);
  drawCompass(ctx, size * 0.16, size * 0.16, size * 0.12, yaw);
}

/* ---------------------------------------------------------------- icons */

interface IconSpec {
  /** Disc colour, following the Classic map key. */
  fill: string;
  glyph: string;
  ink: string;
}

const SHOP_ICONS: Record<string, IconSpec> = {
  general: { fill: "#d8d8d0", glyph: "shop", ink: "#3a3a3a" },
  axes: { fill: "#d8d8d0", glyph: "axe", ink: "#7a5230" },
  swords: { fill: "#d8d8d0", glyph: "sword", ink: "#c02020" },
  scimitars: { fill: "#d8d8d0", glyph: "sword", ink: "#c02020" },
  armour: { fill: "#d8d8d0", glyph: "body", ink: "#4a4a5a" },
  helmets: { fill: "#d8d8d0", glyph: "helmet", ink: "#4a4a5a" },
  shields: { fill: "#d8d8d0", glyph: "shield", ink: "#4a4a5a" },
  archery: { fill: "#d8d8d0", glyph: "bow", ink: "#7a5230" },
  runes: { fill: "#d8d8d0", glyph: "rune", ink: "#c02ac0" },
  fishing: { fill: "#d8d8d0", glyph: "fish", ink: "#2f6aa8" },
};

const OBJECT_ICONS: Record<string, IconSpec> = {
  bank_chest: { fill: "#e8d24a", glyph: "bank", ink: "#3a2f00" },
  altar: { fill: "#d8d8d0", glyph: "altar", ink: "#6a3f9a" },
  furnace: { fill: "#d8d8d0", glyph: "furnace", ink: "#e0642a" },
  anvil: { fill: "#d8d8d0", glyph: "anvil", ink: "#4a4a52" },
  range: { fill: "#d8d8d0", glyph: "range", ink: "#c02020" },
};

/**
 * Icons crowd together where a shop has three counters or a mine has six
 * rocks, so only the first of each kind within a few tiles is drawn.
 */
function drawIcons(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  at: (x: number, y: number) => { x: number; y: number },
  scale: number,
): void {
  const drawn: { x: number; y: number; key: string }[] = [];
  const size = Math.max(7, scale * 3.4);

  const visit = (object: WorldObject) => {
    const spec = iconFor(object);
    if (!spec) return;
    const key = spec.glyph;
    if (
      drawn.some(
        (was) =>
          was.key === key && Math.hypot(was.x - object.x, was.y - object.y) < 6,
      )
    ) {
      return;
    }
    drawn.push({ x: object.x, y: object.y, key });
    const spot = at(object.x + 0.5, object.y + 0.5);
    icon(ctx, spot.x, spot.y, size, spec);
  };

  // A turned map shows the corners of a wider square than it is tall.
  const { map, player } = state;
  const reach = MINIMAP_TILES * 0.75;
  const minX = Math.max(0, Math.floor(player.fx - reach));
  const minY = Math.max(0, Math.floor(player.fy - reach));
  const maxX = Math.min(map.size, Math.ceil(player.fx + reach));
  const maxY = Math.min(map.size, Math.ceil(player.fy + reach));
  for (let y = minY; y < maxY; y++) {
    for (let x = minX; x < maxX; x++) {
      const object = map.objects[tileIndex(map, x, y)];
      if (object) visit(object);
    }
  }
}

function iconFor(object: WorldObject): IconSpec | null {
  if (object.defId === "shop_counter") {
    return SHOP_ICONS[object.shopId ?? "general"] ?? SHOP_ICONS.general;
  }
  if (object.defId.startsWith("fish_")) {
    return { fill: "#2f6aa8", glyph: "fish", ink: "#dceaff" };
  }
  if (object.defId.startsWith("rock_") && object.defId !== "rock_empty") {
    return { fill: "#d8d8d0", glyph: "mine", ink: "#4a4a52" };
  }
  return OBJECT_ICONS[object.defId] ?? null;
}

function icon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  spec: IconSpec,
): void {
  const r = size / 2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = spec.fill;
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(0,0,0,0.85)";
  ctx.stroke();

  ctx.fillStyle = spec.ink;
  ctx.strokeStyle = spec.ink;
  ctx.lineWidth = Math.max(1, size / 8);
  const u = size / 10;
  switch (spec.glyph) {
    case "bank":
      ctx.fillRect(x - 3 * u, y - u, 6 * u, 2 * u);
      ctx.fillRect(x - u, y - 3.5 * u, 2 * u, 7 * u);
      break;
    case "sword":
      ctx.fillRect(x - u, y - 3.5 * u, 2 * u, 5 * u);
      ctx.fillRect(x - 2.5 * u, y + 1.5 * u, 5 * u, 1.5 * u);
      break;
    case "axe":
      ctx.fillRect(x - 0.8 * u, y - 3 * u, 1.6 * u, 6.5 * u);
      ctx.fillRect(x - 3.5 * u, y - 3.5 * u, 3.5 * u, 3 * u);
      break;
    case "bow":
      ctx.beginPath();
      ctx.arc(x - u, y, 3 * u, -1.1, 1.1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 1.6 * u, y - 2.6 * u);
      ctx.lineTo(x + 1.6 * u, y + 2.6 * u);
      ctx.stroke();
      break;
    case "helmet":
      ctx.beginPath();
      ctx.arc(x, y, 3 * u, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(x - 3 * u, y, 6 * u, 1.5 * u);
      break;
    case "body":
      ctx.fillRect(x - 3 * u, y - 3 * u, 6 * u, 6 * u);
      ctx.clearRect(x - u, y - 3 * u, 2 * u, 2 * u);
      break;
    case "shield":
      ctx.beginPath();
      ctx.moveTo(x - 3 * u, y - 3 * u);
      ctx.lineTo(x + 3 * u, y - 3 * u);
      ctx.lineTo(x, y + 3.5 * u);
      ctx.closePath();
      ctx.fill();
      break;
    case "rune":
      ctx.beginPath();
      ctx.moveTo(x, y - 3.5 * u);
      ctx.lineTo(x + 3 * u, y);
      ctx.lineTo(x, y + 3.5 * u);
      ctx.lineTo(x - 3 * u, y);
      ctx.closePath();
      ctx.fill();
      break;
    case "fish":
      ctx.beginPath();
      ctx.moveTo(x - 3.5 * u, y);
      ctx.quadraticCurveTo(x, y - 3 * u, x + 2.5 * u, y);
      ctx.quadraticCurveTo(x, y + 3 * u, x - 3.5 * u, y);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 2.2 * u, y);
      ctx.lineTo(x + 4 * u, y - 2 * u);
      ctx.lineTo(x + 4 * u, y + 2 * u);
      ctx.closePath();
      ctx.fill();
      break;
    case "mine":
      ctx.beginPath();
      ctx.moveTo(x - 3.5 * u, y + 1.5 * u);
      ctx.lineTo(x, y - 3 * u);
      ctx.lineTo(x + 3.5 * u, y + 1.5 * u);
      ctx.closePath();
      ctx.fill();
      break;
    case "furnace":
      ctx.beginPath();
      ctx.moveTo(x, y - 3.5 * u);
      ctx.quadraticCurveTo(x + 3 * u, y, x, y + 3 * u);
      ctx.quadraticCurveTo(x - 3 * u, y, x, y - 3.5 * u);
      ctx.fill();
      break;
    case "anvil":
      ctx.fillRect(x - 3.5 * u, y - 2 * u, 7 * u, 2 * u);
      ctx.fillRect(x - 1.5 * u, y, 3 * u, 3 * u);
      break;
    case "range":
      ctx.fillRect(x - 3 * u, y - 2.5 * u, 6 * u, 5 * u);
      ctx.clearRect(x - 1.5 * u, y - u, 3 * u, 2.5 * u);
      break;
    default:
      ctx.fillRect(x - 2.5 * u, y - 2.5 * u, 5 * u, 5 * u);
      ctx.clearRect(x - u, y - 1.5 * u, 2 * u, 3 * u);
  }
}

/* --------------------------------------------------------------- chrome */

function drawFrame(ctx: CanvasRenderingContext2D, size: number): void {
  const radius = size / 2;
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#0d0b06";
  ctx.beginPath();
  ctx.arc(radius, radius, radius - 1.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(200,180,120,0.35)";
  ctx.beginPath();
  ctx.arc(radius, radius, radius - 4, 0, Math.PI * 2);
  ctx.stroke();
}

function drawCompass(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  yaw: number,
): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(20,18,12,0.9)";
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "#c8b478";
  ctx.stroke();

  // The needle keeps pointing north however far the camera has been swung.
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-yaw);
  ctx.translate(-x, -y);

  // Two halves meeting at the centre: red points north, white points south.
  const wing = r * 0.34;
  ctx.beginPath();
  ctx.moveTo(x, y - r * 0.8);
  ctx.lineTo(x - wing, y);
  ctx.lineTo(x + wing, y);
  ctx.closePath();
  ctx.fillStyle = "#d02020";
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x, y + r * 0.8);
  ctx.lineTo(x - wing, y);
  ctx.lineTo(x + wing, y);
  ctx.closePath();
  ctx.fillStyle = "#f0ece0";
  ctx.fill();
  ctx.restore();
}

function cross(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  arm: number,
): void {
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(2.5, arm / 1.6);
  ctx.strokeStyle = "rgba(0,0,0,0.75)";
  strokeCross(ctx, x, y, arm);
  ctx.lineWidth = Math.max(1.2, arm / 3);
  ctx.strokeStyle = "#ffe14a";
  strokeCross(ctx, x, y, arm);
  ctx.lineCap = "butt";
}

function strokeCross(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  arm: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x - arm, y - arm);
  ctx.lineTo(x + arm, y + arm);
  ctx.moveTo(x + arm, y - arm);
  ctx.lineTo(x - arm, y + arm);
  ctx.stroke();
}

function dot(
  ctx: CanvasRenderingContext2D,
  spot: { x: number; y: number },
  size: number,
  colour: string,
): void {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(spot.x, spot.y, size, 0, Math.PI * 2);
  ctx.fill();
}

function objectColour(defId: string): string | null {
  if (defId.startsWith("rock_")) return "#9a938c";
  if (defId.startsWith("fish_")) return null;
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
    case "door":
      return "#a67c47";
    case "fire":
      return "#f2a33c";
    default:
      return null;
  }
}
