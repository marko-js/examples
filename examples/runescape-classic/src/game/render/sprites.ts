/** Canvas drawing primitives: characters, scenery, and item icons. */
import type { Icon } from "../icons";
import { getItem } from "../items";
import type { NpcSprite } from "../npcs";
import type { Direction } from "../state";
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
export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tile: number,
  look: CharacterLook,
  facing: Direction,
  walkPhase: number,
): void {
  const scale = (tile / 32) * look.height;
  const unit = (n: number) => n * scale;
  const pose =
    facing === 0 || facing === 1 || facing === 7
      ? "back"
      : facing === 2 || facing === 6
        ? "side"
        : "front";
  const flip = facing === 6 || facing === 5 || facing === 7;
  const swing = Math.sin(walkPhase) * unit(3);

  shadow(ctx, x, y, unit(9), unit(3.5));

  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);

  // Legs
  ctx.fillStyle = look.legs;
  ctx.fillRect(
    unit(-4.5),
    unit(-11) + Math.max(0, swing),
    unit(4),
    unit(11) - Math.max(0, swing),
  );
  ctx.fillRect(
    unit(0.5),
    unit(-11) + Math.max(0, -swing),
    unit(4),
    unit(11) - Math.max(0, -swing),
  );

  if (look.cape) {
    ctx.fillStyle = look.cape;
    ctx.beginPath();
    ctx.moveTo(unit(-7), unit(-24));
    ctx.lineTo(unit(7), unit(-24));
    ctx.lineTo(unit(9), unit(-6));
    ctx.lineTo(unit(-9), unit(-6));
    ctx.closePath();
    ctx.fill();
  }

  // Torso
  ctx.fillStyle = look.shirt;
  const bodyWidth = pose === "side" ? unit(8) : unit(11);
  ctx.fillRect(-bodyWidth / 2, unit(-23), bodyWidth, unit(12));

  // Arms
  ctx.fillStyle = look.shirt;
  ctx.fillRect(
    -bodyWidth / 2 - unit(2.5),
    unit(-22) - swing * 0.6,
    unit(3),
    unit(10),
  );
  ctx.fillStyle = look.skin;
  ctx.fillRect(
    -bodyWidth / 2 - unit(2.5),
    unit(-13) - swing * 0.6,
    unit(3),
    unit(3),
  );
  ctx.fillStyle = look.shirt;
  ctx.fillRect(
    bodyWidth / 2 - unit(0.5),
    unit(-22) + swing * 0.6,
    unit(3),
    unit(10),
  );
  ctx.fillStyle = look.skin;
  ctx.fillRect(
    bodyWidth / 2 - unit(0.5),
    unit(-13) + swing * 0.6,
    unit(3),
    unit(3),
  );

  if (look.shield) {
    ctx.fillStyle = look.shield;
    ctx.fillRect(-bodyWidth / 2 - unit(6), unit(-21), unit(5), unit(9));
  }
  if (look.weapon) {
    ctx.fillStyle = look.weapon;
    ctx.fillRect(
      bodyWidth / 2 + unit(1.5),
      unit(-27) + swing * 0.6,
      unit(2),
      unit(15),
    );
  }

  // Head
  ctx.fillStyle = look.skin;
  ctx.beginPath();
  ctx.arc(0, unit(-27.5), unit(5), 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = look.helmet ?? look.hair;
  ctx.beginPath();
  ctx.arc(0, unit(-28.5), unit(5), Math.PI, Math.PI * 2);
  ctx.fill();
  if (look.helmet) {
    ctx.fillRect(unit(-5), unit(-29), unit(10), unit(3));
    ctx.fillRect(unit(-1), unit(-29), unit(2), unit(6));
  }

  if (pose === "front") {
    ctx.fillStyle = "#2b2118";
    ctx.fillRect(unit(-2.5), unit(-28), unit(1.5), unit(1.5));
    ctx.fillRect(unit(1), unit(-28), unit(1.5), unit(1.5));
  } else if (pose === "side") {
    ctx.fillStyle = "#2b2118";
    ctx.fillRect(unit(1.5), unit(-28), unit(1.5), unit(1.5));
  }

  ctx.restore();
}

export function drawNpc(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tile: number,
  sprite: NpcSprite,
  facing: Direction,
  walkPhase: number,
): void {
  if (sprite.kind === "humanoid") {
    drawCharacter(
      ctx,
      x,
      y,
      tile,
      {
        skin: sprite.skin,
        hair: sprite.hair,
        shirt: sprite.shirt,
        legs: sprite.legs,
        height: sprite.height,
      },
      facing,
      walkPhase,
    );
    return;
  }
  if (sprite.kind === "bird")
    drawBird(ctx, x, y, tile, sprite, facing, walkPhase);
  else drawBeast(ctx, x, y, tile, sprite, facing, walkPhase);
}

function drawBird(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tile: number,
  sprite: Extract<NpcSprite, { kind: "bird" }>,
  facing: Direction,
  walkPhase: number,
): void {
  const s = tile / 32;
  const flip = facing >= 5;
  shadow(ctx, x, y, 7 * s, 3 * s);
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);

  ctx.strokeStyle = "#c8901f";
  ctx.lineWidth = 1.5 * s;
  ctx.beginPath();
  ctx.moveTo(-2 * s, 0);
  ctx.lineTo(-2 * s, -5 * s + Math.sin(walkPhase) * s);
  ctx.moveTo(2 * s, 0);
  ctx.lineTo(2 * s, -5 * s - Math.sin(walkPhase) * s);
  ctx.stroke();

  ctx.fillStyle = sprite.body;
  ctx.beginPath();
  ctx.ellipse(0, -9 * s, 8 * s, 6 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = sprite.wing;
  ctx.beginPath();
  ctx.ellipse(-1 * s, -9 * s, 4 * s, 3 * s, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = sprite.body;
  ctx.beginPath();
  ctx.arc(6 * s, -15 * s, 4 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = sprite.comb;
  ctx.fillRect(4 * s, -20 * s, 4 * s, 2 * s);
  ctx.fillStyle = sprite.beak;
  ctx.beginPath();
  ctx.moveTo(9 * s, -15 * s);
  ctx.lineTo(13 * s, -14 * s);
  ctx.lineTo(9 * s, -13 * s);
  ctx.fill();
  ctx.fillStyle = "#2b2118";
  ctx.fillRect(6 * s, -16 * s, 1.5 * s, 1.5 * s);
  ctx.restore();
}

function drawBeast(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tile: number,
  sprite: Extract<NpcSprite, { kind: "beast" }>,
  facing: Direction,
  walkPhase: number,
): void {
  const s = (tile / 32) * sprite.width;
  const h = (tile / 32) * sprite.height;
  const flip = facing >= 5;
  shadow(ctx, x, y, 12 * s, 4 * s);
  ctx.save();
  ctx.translate(x, y);
  if (flip) ctx.scale(-1, 1);

  ctx.strokeStyle = sprite.body;
  ctx.lineWidth = 2.5 * s;
  for (const [i, legX] of [-7, -3, 3, 7].entries()) {
    ctx.beginPath();
    ctx.moveTo(legX * s, 0);
    ctx.lineTo(legX * s + Math.sin(walkPhase + i) * s, -10 * h);
    ctx.stroke();
  }

  ctx.fillStyle = sprite.body;
  ctx.beginPath();
  ctx.ellipse(0, -15 * h, 11 * s, 7 * h, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = sprite.belly;
  ctx.beginPath();
  ctx.ellipse(-2 * s, -12 * h, 6 * s, 3.5 * h, 0, 0, Math.PI * 2);
  ctx.fill();

  if (sprite.tail) {
    ctx.strokeStyle = sprite.snout;
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.moveTo(-10 * s, -16 * h);
    ctx.quadraticCurveTo(-18 * s, -18 * h, -16 * s, -8 * h);
    ctx.stroke();
  }

  ctx.fillStyle = sprite.body;
  ctx.beginPath();
  ctx.arc(11 * s, -19 * h, 5.5 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = sprite.snout;
  ctx.beginPath();
  ctx.ellipse(15 * s, -17 * h, 3 * s, 2 * h, 0, 0, Math.PI * 2);
  ctx.fill();
  if (sprite.horns) {
    ctx.fillStyle = "#d8d0be";
    ctx.fillRect(7 * s, -26 * h, 2 * s, 5 * h);
    ctx.fillRect(14 * s, -26 * h, 2 * s, 5 * h);
  }
  ctx.fillStyle = "#2b2118";
  ctx.fillRect(12 * s, -21 * h, 1.5 * s, 1.5 * s);
  ctx.restore();
}

/** Scenery, drawn with its base at (x, y) and free to extend upward. */
export function drawObjectArt(
  ctx: CanvasRenderingContext2D,
  art: ObjectArt,
  x: number,
  y: number,
  tile: number,
  time: number,
): void {
  const s = tile / 32;
  switch (art.kind) {
    case "tree": {
      const size = art.size;
      shadow(ctx, x, y, 11 * s * size, 4 * s);
      ctx.fillStyle = art.trunk;
      ctx.fillRect(
        x - 3 * s * size,
        y - 18 * s * size,
        6 * s * size,
        18 * s * size,
      );
      const sway = Math.sin(time / 900 + x * 0.05) * s;
      ctx.fillStyle = art.canopyShade;
      circle(ctx, x + sway, y - 26 * s * size, 15 * s * size);
      ctx.fillStyle = art.canopy;
      circle(ctx, x - 6 * s * size + sway, y - 30 * s * size, 10 * s * size);
      circle(ctx, x + 7 * s * size + sway, y - 28 * s * size, 9 * s * size);
      circle(ctx, x + sway, y - 36 * s * size, 9 * s * size);
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
      // Low walls, so the inside of a building stays visible from outside.
      const height = tile * 0.68;
      ctx.fillStyle = art.face;
      ctx.fillRect(x - tile / 2, y - height, tile, height);
      ctx.fillStyle = art.top;
      ctx.fillRect(x - tile / 2, y - height - tile * 0.16, tile, tile * 0.18);
      ctx.fillStyle = "rgba(0,0,0,0.16)";
      for (let row = 0; row < 2; row++) {
        ctx.fillRect(
          x - tile / 2,
          Math.round(y - height + tile * (0.22 + row * 0.24)),
          tile,
          1,
        );
      }
      ctx.fillRect(Math.round(x - tile * 0.02), y - height, 1, height);
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
