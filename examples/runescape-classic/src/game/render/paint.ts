/**
 * The painting primitives the scene is built from: flat shaded faces in world
 * space, drawn back to front the way Classic drew its polygons.
 */
import { DRAW_DISTANCE } from "../config";
import { type Camera, project } from "./projection";

export type Vertex = readonly [number, number, number];

/** How far into the fade a depth is: 1 in the clear, 0 in the void. */
export function fogAt(camera: Camera, depth: number): number {
  const forward = (depth - camera.z * camera.sin) / camera.cos;
  return Math.min(1, Math.max(0, (DRAW_DISTANCE - forward) / FOG_TILES));
}

const FOG_TILES = 8;

/**
 * A polygon in world space. `light` is the face's own shading; the distance
 * fade is folded in on top so models sink into the void as the ground does.
 */
export function face(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  points: readonly Vertex[],
  colour: string,
  light: number,
): void {
  let nearest = Infinity;
  ctx.beginPath();
  for (const [index, [x, y, z]] of points.entries()) {
    const spot = project(camera, x, y, z);
    if (spot.depth <= 0.1) return;
    nearest = Math.min(nearest, spot.depth);
    if (index === 0) ctx.moveTo(spot.sx, spot.sy);
    else ctx.lineTo(spot.sx, spot.sy);
  }
  ctx.closePath();
  ctx.fillStyle = shade(colour, light * fogAt(camera, nearest));
  ctx.fill();
}

/** North, south, west and east faces take these shares of the light. */
const SIDE_LIGHT = [0.78, 0.94, 0.86, 0.86];
const TOP_LIGHT = 1.08;

/**
 * An axis aligned box, with only the sides the camera can see painted.
 * `courses` rules that many block courses across each side.
 */
export function box(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  x: number,
  y: number,
  w: number,
  d: number,
  base: number,
  top: number,
  colour: string,
  sides: readonly boolean[] = [true, true, true, true],
  courses = 0,
): void {
  const x2 = x + w;
  const y2 = y + d;
  if (sides[0] && camera.y < y) {
    quad(
      ctx,
      camera,
      [x, y],
      [x2, y],
      base,
      top,
      colour,
      SIDE_LIGHT[0],
      courses,
    );
  }
  if (sides[1] && camera.y > y2) {
    quad(
      ctx,
      camera,
      [x, y2],
      [x2, y2],
      base,
      top,
      colour,
      SIDE_LIGHT[1],
      courses,
    );
  }
  if (sides[2] && camera.x < x) {
    quad(
      ctx,
      camera,
      [x, y],
      [x, y2],
      base,
      top,
      colour,
      SIDE_LIGHT[2],
      courses,
    );
  }
  if (sides[3] && camera.x > x2) {
    quad(
      ctx,
      camera,
      [x2, y],
      [x2, y2],
      base,
      top,
      colour,
      SIDE_LIGHT[3],
      courses,
    );
  }
  face(
    ctx,
    camera,
    [
      [x, y, top],
      [x2, y, top],
      [x2, y2, top],
      [x, y2, top],
    ],
    colour,
    TOP_LIGHT,
  );
}

function quad(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  from: readonly [number, number],
  to: readonly [number, number],
  base: number,
  top: number,
  colour: string,
  light: number,
  courses = 0,
): void {
  face(
    ctx,
    camera,
    [
      [from[0], from[1], base],
      [to[0], to[1], base],
      [to[0], to[1], top],
      [from[0], from[1], top],
    ],
    colour,
    light,
  );
  // Mortar between the blocks, which is what makes a wall read as masonry.
  // Every other course is offset, so the joints stagger like real brickwork.
  const along = (t: number): [number, number] => [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
  ];
  const mortar = light * 0.72;
  const thick = (top - base) * 0.035;
  for (let i = 0; i < courses; i++) {
    const low = base + ((top - base) * i) / courses;
    const high = base + ((top - base) * (i + 1)) / courses;
    if (i > 0) {
      face(
        ctx,
        camera,
        [
          [from[0], from[1], low],
          [to[0], to[1], low],
          [to[0], to[1], low + thick],
          [from[0], from[1], low + thick],
        ],
        colour,
        mortar,
      );
    }
    for (const at of i % 2 ? [0.25, 0.75] : [0.5]) {
      const left = along(at);
      const right = along(at + 0.018);
      face(
        ctx,
        camera,
        [
          [left[0], left[1], low + thick],
          [right[0], right[1], low + thick],
          [right[0], right[1], high],
          [left[0], left[1], high],
        ],
        colour,
        mortar,
      );
    }
  }
}

/** A basis for a model that has been turned to face a direction. */
export interface Facing {
  /** Unit vector to the model's right, and the one it looks along. */
  rx: number;
  ry: number;
  fx: number;
  fy: number;
}

/** Direction 0 is north, and they run clockwise from there. */
export function facingOf(direction: number): Facing {
  const angle = (direction * Math.PI) / 4;
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  return { rx: cos, ry: sin, fx: sin, fy: -cos };
}

/**
 * A box turned to face a direction. Its faces are painted back to front, which
 * is all the sorting a convex shape needs. `tilt` leans the top away from the
 * base, which is how a limb swings: the shoulder stays put and the hand moves.
 */
export function prism(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  at: { x: number; y: number },
  facing: Facing,
  size: { right: number; forward: number; base: number; top: number },
  offset: { right: number; forward: number },
  colour: string,
  tilt: { right: number; forward: number } = { right: 0, forward: 0 },
): void {
  const place = (
    right: number,
    forward: number,
    lean: number,
  ): [number, number] => [
    at.x +
      (offset.right + right + tilt.right * lean) * facing.rx +
      (offset.forward + forward + tilt.forward * lean) * facing.fx,
    at.y +
      (offset.right + right + tilt.right * lean) * facing.ry +
      (offset.forward + forward + tilt.forward * lean) * facing.fy,
  ];
  const at4 = (lean: number) => [
    place(-size.right, -size.forward, lean),
    place(size.right, -size.forward, lean),
    place(size.right, size.forward, lean),
    place(-size.right, size.forward, lean),
  ];
  const corners = at4(0);
  const tops = at4(1);

  // Furthest side down first, so the near ones cover it, whichever way the
  // camera is turned.
  const away = (from: readonly number[], to: readonly number[]) =>
    Math.hypot(
      (from[0] + to[0]) / 2 - camera.x,
      (from[1] + to[1]) / 2 - camera.y,
    );
  const walls = corners
    .map((from, index) => ({
      from: [...from, index] as [number, number, number],
      to: [...corners[(index + 1) % 4], (index + 1) % 4] as [
        number,
        number,
        number,
      ],
      light: SIDE_LIGHT[index],
    }))
    .sort((a, b) => away(b.from, b.to) - away(a.from, a.to));

  for (const wall of walls) {
    face(
      ctx,
      camera,
      [
        [wall.from[0], wall.from[1], size.base],
        [wall.to[0], wall.to[1], size.base],
        [tops[wall.to[2]][0], tops[wall.to[2]][1], size.top],
        [tops[wall.from[2]][0], tops[wall.from[2]][1], size.top],
      ],
      colour,
      wall.light,
    );
  }
  face(
    ctx,
    camera,
    tops.map(([x, y]) => [x, y, size.top] as Vertex),
    colour,
    TOP_LIGHT,
  );
}

export function rgbOf(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [value >> 16, (value >> 8) & 0xff, value & 0xff];
}

/** Multiply a hex colour, for the lit and shaded faces of a model. */
export function shade(hex: string, factor: number): string {
  const [red, green, blue] = rgbOf(hex);
  const part = (value: number) => Math.min(255, Math.round(value * factor));
  return `rgb(${part(red)},${part(green)},${part(blue)})`;
}
