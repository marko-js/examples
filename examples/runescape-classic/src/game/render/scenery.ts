/**
 * The furniture of the world as models: fires, forges, wells, signposts and
 * the rest, built from the same blocks everything else is.
 */
import { hash2d } from "../rng";
import type { ObjectArt } from "../world";
import { box, face } from "./paint";
import type { Camera } from "./projection";

/**
 * Draw a piece of scenery. Returns false for the few kinds that are still
 * better as a flat sprite, which the caller then falls back to.
 */
export function drawScenery(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  art: ObjectArt,
  tx: number,
  ty: number,
  time: number,
): boolean {
  const at = (inset: number, base: number, top: number, colour: string) =>
    box(
      ctx,
      camera,
      tx + inset,
      ty + inset,
      1 - inset * 2,
      1 - inset * 2,
      base,
      top,
      colour,
    );

  switch (art.kind) {
    case "stump":
      at(0.34, 0, 0.22, art.trunk);
      return true;

    case "bush":
      at(0.16, 0, 0.5, art.colour);
      at(0.28, 0.5, 0.62, art.colour);
      return true;

    case "flowers":
      for (let i = 0; i < 5; i++) {
        const fx = tx + 0.2 + hash2d(tx, ty, i) * 0.6;
        const fy = ty + 0.2 + hash2d(tx, ty, i + 8) * 0.6;
        box(ctx, camera, fx, fy, 0.06, 0.06, 0, 0.22, "#3f7a2c");
        box(
          ctx,
          camera,
          fx - 0.03,
          fy - 0.03,
          0.12,
          0.12,
          0.2,
          0.26,
          art.colour,
        );
      }
      return true;

    case "sign":
      box(ctx, camera, tx + 0.46, ty + 0.46, 0.08, 0.08, 0, 0.9, "#6b4526");
      box(ctx, camera, tx + 0.2, ty + 0.44, 0.6, 0.12, 0.62, 0.98, "#a3763f");
      return true;

    case "well":
      // A ring of stone, two posts and a little roof over the top.
      at(0.18, 0, 0.55, "#8d857c");
      at(0.3, 0.5, 0.58, "#2b2b33");
      for (const side of [0.16, 0.78]) {
        box(
          ctx,
          camera,
          tx + side,
          ty + 0.46,
          0.07,
          0.07,
          0.55,
          1.5,
          "#6b4526",
        );
      }
      face(
        ctx,
        camera,
        [
          [tx + 0.05, ty + 0.05, 1.45],
          [tx + 0.95, ty + 0.05, 1.45],
          [tx + 0.5, ty + 0.5, 1.85],
        ],
        "#a0503c",
        1.12,
      );
      face(
        ctx,
        camera,
        [
          [tx + 0.05, ty + 0.95, 1.45],
          [tx + 0.95, ty + 0.95, 1.45],
          [tx + 0.5, ty + 0.5, 1.85],
        ],
        "#a0503c",
        0.78,
      );
      return true;

    case "altar":
      at(0.12, 0, 0.72, "#b7b0a4");
      at(0.04, 0.72, 0.86, "#cfc8ba");
      for (const side of [0.14, 0.76]) {
        box(ctx, camera, tx + side, ty + 0.4, 0.1, 0.1, 0.86, 1.06, "#e8dfae");
      }
      return true;

    case "range":
      at(0.1, 0, 0.85, "#7d786f");
      // The mouth of the oven, glowing on the side you face it from.
      face(
        ctx,
        camera,
        [
          [tx + 0.28, ty + 0.09, 0.15],
          [tx + 0.72, ty + 0.09, 0.15],
          [tx + 0.72, ty + 0.09, 0.6],
          [tx + 0.28, ty + 0.09, 0.6],
        ],
        "#e8622a",
        1,
      );
      return true;

    case "furnace":
      at(0.04, 0, 1.1, "#6f6a62");
      box(ctx, camera, tx + 0.6, ty + 0.6, 0.28, 0.28, 1.1, 1.75, "#5a554e");
      face(
        ctx,
        camera,
        [
          [tx + 0.24, ty + 0.03, 0.2],
          [tx + 0.76, ty + 0.03, 0.2],
          [tx + 0.76, ty + 0.03, 0.75],
          [tx + 0.24, ty + 0.03, 0.75],
        ],
        "#f2a33c",
        1,
      );
      return true;

    case "anvil":
      box(ctx, camera, tx + 0.32, ty + 0.32, 0.36, 0.36, 0, 0.34, "#4a4a52");
      box(ctx, camera, tx + 0.16, ty + 0.28, 0.68, 0.44, 0.34, 0.56, "#6e6e76");
      return true;

    case "door":
      box(ctx, camera, tx + 0.06, ty + 0.4, 0.88, 0.2, 0, 1.5, art.colour);
      return true;

    case "boat":
      box(ctx, camera, tx - 0.4, ty + 0.1, 1.8, 0.8, 0, 0.45, "#6b4526");
      box(ctx, camera, tx + 0.4, ty + 0.42, 0.1, 0.1, 0.45, 2.1, "#8a6136");
      return true;

    case "fire": {
      const flicker = Math.sin(time / 90) * 0.08;
      at(0.3, 0, 0.12, "#4a3524");
      for (const [inset, height, colour] of [
        [0.32, 0.7, "#e8622a"],
        [0.38, 0.55, "#f2a33c"],
      ] as const) {
        face(
          ctx,
          camera,
          [
            [tx + inset, ty + inset, 0.1],
            [tx + 1 - inset, ty + inset, 0.1],
            [tx + 0.5, ty + 0.5, height + flicker],
          ],
          colour,
          1.1,
        );
        face(
          ctx,
          camera,
          [
            [tx + inset, ty + 1 - inset, 0.1],
            [tx + 1 - inset, ty + 1 - inset, 0.1],
            [tx + 0.5, ty + 0.5, height + flicker],
          ],
          colour,
          0.86,
        );
      }
      return true;
    }

    default:
      return false;
  }
}
