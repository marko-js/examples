/** Canvas drawing primitives: characters, scenery, and item icons. */
import type { Icon } from "../icons";
import { getItem } from "../items";
import type { ObjectArt } from "../world";

export interface CharacterLook {
  skin: string;
  hair: string;
  shirt: string;
  legs: string;
  helmet?: string;
  weapon?: string;
  shield?: string;
  cape?: string;
  height: number;
}

/** Draw an item icon, authored on a 32x32 grid, at an arbitrary size. */
export function drawIcon(
  ctx: CanvasRenderingContext2D,
  icon: Icon,
  x: number,
  y: number,
  size: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 32, size / 32);
  for (const shape of icon) {
    ctx.fillStyle = shape.fill;
    if (shape.kind === "rect") {
      ctx.fillRect(shape.x, shape.y, shape.w, shape.h);
    } else if (shape.kind === "circle") {
      ctx.beginPath();
      ctx.arc(shape.cx, shape.cy, shape.r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      const points = shape.points.split(" ");
      for (const [index, point] of points.entries()) {
        const [px, py] = point.split(",").map(Number);
        if (index === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawItemIcon(
  ctx: CanvasRenderingContext2D,
  id: string,
  x: number,
  y: number,
  size: number,
): void {
  drawIcon(ctx, getItem(id).icon, x, y, size);
}

/**
 * A little humanoid standing with its feet at (x, y). Poses are picked from the
 * facing direction: front, back, or profile.
 */
export function drawObjectArt(
  ctx: CanvasRenderingContext2D,
  art: ObjectArt,
  x: number,
  y: number,
  tile: number,
  time: number,
  seed = 0,
): void {
  const s = tile / 32;
  switch (art.kind) {
    case "tree": {
      const size = art.size;
      shadow(ctx, x, y, 10 * s * size, 3.5 * s);
      ctx.fillStyle = art.trunk;
      ctx.fillRect(
        x - 3.5 * s * size,
        y - 26 * s * size,
        7 * s * size,
        26 * s * size,
      );
      const sway = Math.sin(time / 900 + x * 0.05) * s;
      ctx.fillStyle = art.canopyShade;
      circle(ctx, x + sway, y - 36 * s * size, 16 * s * size);
      ctx.fillStyle = art.canopy;
      circle(ctx, x - 7 * s * size + sway, y - 41 * s * size, 11 * s * size);
      circle(ctx, x + 8 * s * size + sway, y - 39 * s * size, 10 * s * size);
      circle(ctx, x + sway, y - 48 * s * size, 10 * s * size);
      break;
    }
    case "stump":
      shadow(ctx, x, y, 9 * s, 3 * s);
      ctx.fillStyle = art.trunk;
      ctx.fillRect(x - 5 * s, y - 8 * s, 10 * s, 8 * s);
      ctx.fillStyle = "#8a6136";
      ctx.beginPath();
      ctx.ellipse(x, y - 8 * s, 5 * s, 2 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "rock":
      shadow(ctx, x, y, 13 * s, 4 * s);
      ctx.beginPath();
      ctx.moveTo(x - 15 * s, y);
      ctx.lineTo(x - 12 * s, y - 17 * s);
      ctx.lineTo(x - 2 * s, y - 25 * s);
      ctx.lineTo(x + 10 * s, y - 19 * s);
      ctx.lineTo(x + 15 * s, y - 4 * s);
      ctx.lineTo(x + 10 * s, y);
      ctx.closePath();
      ctx.fillStyle = art.body;
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.45)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#b3a99f";
      ctx.beginPath();
      ctx.moveTo(x - 12 * s, y - 17 * s);
      ctx.lineTo(x - 2 * s, y - 25 * s);
      ctx.lineTo(x - 3 * s, y - 15 * s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.16)";
      ctx.beginPath();
      ctx.moveTo(x + 10 * s, y - 19 * s);
      ctx.lineTo(x + 15 * s, y - 4 * s);
      ctx.lineTo(x + 8 * s, y - 8 * s);
      ctx.closePath();
      ctx.fill();
      if (art.vein) {
        ctx.fillStyle = art.vein;
        circle(ctx, x - 5 * s, y - 13 * s, 2.8 * s);
        circle(ctx, x + 5 * s, y - 9 * s, 2.4 * s);
        circle(ctx, x + 1 * s, y - 18 * s, 2 * s);
      }
      break;
    case "wall": {
      const height = tile * 0.94;
      ctx.fillStyle = art.face;
      ctx.fillRect(x - tile / 2, y - height, tile, height);

      // Courses of blocks, then a lighter cap along the top of the wall.
      ctx.fillStyle = "rgba(0,0,0,0.16)";
      const course = height / 4;
      for (let i = 1; i < 4; i++) {
        ctx.fillRect(
          x - tile / 2,
          Math.round(y - height + course * i),
          tile,
          1,
        );
        const offset = i % 2 ? tile * 0.25 : tile * 0.75;
        ctx.fillRect(
          Math.round(x - tile / 2 + offset),
          y - height + course * (i - 1),
          1,
          course,
        );
      }
      ctx.fillStyle = art.top;
      ctx.fillRect(x - tile / 2, y - height - tile * 0.16, tile, tile * 0.2);

      // Roughly every fourth block carries a shuttered window.
      if (seed % 4 === 1) {
        const w = tile * 0.3;
        const h = height * 0.34;
        const wx = x - w / 2;
        const wy = y - height * 0.78;
        ctx.fillStyle = "#2b2b33";
        ctx.fillRect(wx - 2, wy - 2, w + 4, h + 4);
        ctx.fillStyle = "#6f9ad0";
        ctx.fillRect(wx, wy, w, h);
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fillRect(wx, wy, w, h * 0.35);
      }
      break;
    }
    case "fence":
      ctx.fillStyle = "#7a5230";
      ctx.fillRect(x - 11 * s, y - 20 * s, 3 * s, 20 * s);
      ctx.fillRect(x + 8 * s, y - 20 * s, 3 * s, 20 * s);
      ctx.fillStyle = "#96683d";
      ctx.fillRect(x - tile / 2, y - 17 * s, tile, 3 * s);
      ctx.fillRect(x - tile / 2, y - 9 * s, tile, 3 * s);
      break;
    case "gate":
      ctx.fillStyle = "#7a5230";
      ctx.fillRect(x - 15 * s, y - 20 * s, 3 * s, 20 * s);
      ctx.fillRect(x + 12 * s, y - 20 * s, 3 * s, 20 * s);
      break;
    case "fire": {
      const flicker = Math.sin(time / 90) * 2 * s;
      ctx.fillStyle = "#4a3524";
      ctx.fillRect(x - 9 * s, y - 4 * s, 18 * s, 4 * s);
      ctx.fillStyle = "#e8622a";
      flame(ctx, x, y - 4 * s, 9 * s, 20 * s + flicker);
      ctx.fillStyle = "#f2a33c";
      flame(ctx, x, y - 4 * s, 6 * s, 14 * s + flicker);
      ctx.fillStyle = "#f8e05a";
      flame(ctx, x, y - 4 * s, 3 * s, 8 * s + flicker * 0.5);
      break;
    }
    case "chest":
      shadow(ctx, x, y, 12 * s, 4 * s);
      ctx.fillStyle = art.colour;
      ctx.fillRect(x - 12 * s, y - 15 * s, 24 * s, 15 * s);
      ctx.fillStyle = "#5b3c22";
      ctx.fillRect(x - 12 * s, y - 21 * s, 24 * s, 7 * s);
      ctx.fillStyle = "#d8a52a";
      ctx.fillRect(x - 3 * s, y - 16 * s, 6 * s, 6 * s);
      break;
    case "counter":
      ctx.fillStyle = art.colour;
      ctx.fillRect(x - tile / 2, y - 16 * s, tile, 16 * s);
      ctx.fillStyle = "#a67c47";
      ctx.fillRect(x - tile / 2, y - 19 * s, tile, 4 * s);
      break;
    case "table":
      shadow(ctx, x, y, 13 * s, 4 * s);
      ctx.fillStyle = "#6b4a2a";
      ctx.fillRect(x - 11 * s, y - 12 * s, 3 * s, 12 * s);
      ctx.fillRect(x + 8 * s, y - 12 * s, 3 * s, 12 * s);
      ctx.fillStyle = "#8a6136";
      ctx.fillRect(x - 14 * s, y - 16 * s, 28 * s, 5 * s);
      break;
    case "ripple": {
      ctx.strokeStyle = "rgba(220,240,255,0.55)";
      ctx.lineWidth = 1.5;
      for (let ring = 0; ring < 3; ring++) {
        const phase = ((time / 700 + ring / 3) % 1) * tile * 0.55;
        ctx.globalAlpha = 0.6 * (1 - phase / (tile * 0.55));
        ctx.beginPath();
        ctx.ellipse(
          x,
          y - tile * 0.5,
          phase + 2,
          (phase + 2) * 0.45,
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    }
    case "bush":
      shadow(ctx, x, y, 10 * s, 3 * s);
      ctx.fillStyle = art.colour;
      circle(ctx, x - 6 * s, y - 7 * s, 7 * s);
      circle(ctx, x + 6 * s, y - 7 * s, 7 * s);
      circle(ctx, x, y - 12 * s, 8 * s);
      break;
    case "flowers":
      ctx.fillStyle = "#2f6a2a";
      for (const [dx, dy] of [
        [-7, -3],
        [0, -6],
        [7, -2],
      ]) {
        ctx.fillRect(x + dx * s, y + dy * s - 5 * s, 1.5 * s, 6 * s);
      }
      ctx.fillStyle = art.colour;
      for (const [dx, dy] of [
        [-7, -3],
        [0, -6],
        [7, -2],
      ]) {
        circle(ctx, x + dx * s + 0.75 * s, y + dy * s - 6 * s, 2.4 * s);
      }
      break;
    case "sign":
      ctx.fillStyle = "#6b4a2a";
      ctx.fillRect(x - 1.5 * s, y - 20 * s, 3 * s, 20 * s);
      ctx.fillStyle = "#a67c47";
      ctx.fillRect(x - 15 * s, y - 32 * s, 30 * s, 13 * s);
      ctx.fillStyle = "#3a2a18";
      ctx.font = `${Math.round(7 * s)}px "Helvetica Neue", Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(art.text, x, y - 23 * s);
      break;
    case "well":
      shadow(ctx, x, y, 14 * s, 5 * s);
      ctx.fillStyle = "#7d7d78";
      ctx.beginPath();
      ctx.ellipse(x, y - 8 * s, 14 * s, 7 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#26568c";
      ctx.beginPath();
      ctx.ellipse(x, y - 9 * s, 10 * s, 4.5 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#6b4a2a";
      ctx.fillRect(x - 12 * s, y - 30 * s, 3 * s, 22 * s);
      ctx.fillRect(x + 9 * s, y - 30 * s, 3 * s, 22 * s);
      ctx.fillStyle = "#8a4a2c";
      ctx.beginPath();
      ctx.moveTo(x - 17 * s, y - 28 * s);
      ctx.lineTo(x, y - 40 * s);
      ctx.lineTo(x + 17 * s, y - 28 * s);
      ctx.closePath();
      ctx.fill();
      break;
    case "range":
      shadow(ctx, x, y, 14 * s, 4 * s);
      ctx.fillStyle = "#5f5a55";
      ctx.fillRect(x - 15 * s, y - 20 * s, 30 * s, 20 * s);
      ctx.fillStyle = "#736d66";
      ctx.fillRect(x - 15 * s, y - 24 * s, 30 * s, 5 * s);
      ctx.fillStyle = "#241c16";
      ctx.fillRect(x - 10 * s, y - 16 * s, 20 * s, 11 * s);
      ctx.fillStyle = "#e8622a";
      flame(ctx, x, y - 6 * s, 7 * s, 11 * s);
      ctx.fillStyle = "#f8c85a";
      flame(ctx, x, y - 6 * s, 4 * s, 7 * s);
      break;
    case "furnace":
      shadow(ctx, x, y, 16 * s, 5 * s);
      ctx.fillStyle = "#6d6560";
      ctx.beginPath();
      ctx.moveTo(x - 17 * s, y);
      ctx.lineTo(x - 14 * s, y - 26 * s);
      ctx.lineTo(x + 14 * s, y - 26 * s);
      ctx.lineTo(x + 17 * s, y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#8b837b";
      ctx.fillRect(x - 15 * s, y - 30 * s, 30 * s, 5 * s);
      ctx.fillStyle = "#241c16";
      ctx.beginPath();
      ctx.arc(x, y - 10 * s, 8 * s, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - 8 * s, y - 10 * s, 16 * s, 8 * s);
      ctx.fillStyle = "#f0902a";
      flame(ctx, x, y - 4 * s, 6 * s, 10 * s);
      ctx.fillStyle = "#f8e05a";
      flame(ctx, x, y - 4 * s, 3 * s, 6 * s);
      break;
    case "anvil":
      shadow(ctx, x, y, 11 * s, 4 * s);
      ctx.fillStyle = "#4a4a52";
      ctx.fillRect(x - 6 * s, y - 10 * s, 12 * s, 10 * s);
      ctx.fillStyle = "#5f5f68";
      ctx.beginPath();
      ctx.moveTo(x - 14 * s, y - 18 * s);
      ctx.lineTo(x + 11 * s, y - 18 * s);
      ctx.lineTo(x + 17 * s, y - 14 * s);
      ctx.lineTo(x + 11 * s, y - 11 * s);
      ctx.lineTo(x - 12 * s, y - 11 * s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#7a7a84";
      ctx.fillRect(x - 14 * s, y - 18 * s, 25 * s, 2 * s);
      break;
    case "door":
      ctx.fillStyle = "#4a3524";
      ctx.fillRect(x - tile / 2, y - tile * 0.9, tile, tile * 0.9);
      ctx.fillStyle = art.colour;
      ctx.fillRect(
        x - tile / 2 + 2 * s,
        y - tile * 0.86,
        tile - 4 * s,
        tile * 0.82,
      );
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(x - tile / 2 + 2 * s, y - tile * 0.5, tile - 4 * s, 2 * s);
      ctx.fillStyle = "#c9a227";
      circle(ctx, x + tile * 0.28, y - tile * 0.45, 2.2 * s);
      break;
    case "boat":
      shadow(ctx, x, y, 18 * s, 5 * s);
      ctx.fillStyle = "#7a5230";
      ctx.beginPath();
      ctx.moveTo(x - 20 * s, y - 12 * s);
      ctx.lineTo(x + 20 * s, y - 12 * s);
      ctx.lineTo(x + 13 * s, y - 1 * s);
      ctx.lineTo(x - 13 * s, y - 1 * s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#96683d";
      ctx.fillRect(x - 20 * s, y - 14 * s, 40 * s, 3 * s);
      ctx.fillStyle = "#5b3c22";
      ctx.fillRect(x - 8 * s, y - 10 * s, 16 * s, 3 * s);
      break;
    case "altar":
      shadow(ctx, x, y, 14 * s, 4 * s);
      ctx.fillStyle = "#9a9a92";
      ctx.fillRect(x - 14 * s, y - 14 * s, 28 * s, 14 * s);
      ctx.fillStyle = "#b6b6ac";
      ctx.fillRect(x - 16 * s, y - 18 * s, 32 * s, 5 * s);
      ctx.fillStyle = "#f2e8c8";
      ctx.fillRect(x - 11 * s, y - 26 * s, 2.5 * s, 8 * s);
      ctx.fillRect(x + 9 * s, y - 26 * s, 2.5 * s, 8 * s);
      ctx.fillStyle = "#f8c85a";
      circle(ctx, x - 9.75 * s, y - 28 * s, 2 * s);
      circle(ctx, x + 10.25 * s, y - 28 * s, 2 * s);
      break;
  }
}

function flame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x - width, y);
  ctx.quadraticCurveTo(x - width * 0.4, y - height * 0.6, x, y - height);
  ctx.quadraticCurveTo(x + width * 0.4, y - height * 0.6, x + width, y);
  ctx.closePath();
  ctx.fill();
}

function circle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function shadow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
): void {
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}
