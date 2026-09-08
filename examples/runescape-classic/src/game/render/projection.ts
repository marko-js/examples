/**
 * Classic drew the world through a pitched camera, not from straight above:
 * the ground runs back to a horizon, walls stand up out of it, and everything
 * shrinks with distance. This is that camera, as a pinhole projection.
 *
 * The camera keeps a fixed bearing — north is up, the way the client started —
 * so the ground plane inverts exactly and a click still lands on a tile.
 */
import {
  CAMERA_BACK,
  CAMERA_HEIGHT,
  CAMERA_PITCH,
  FOCAL_TILES,
} from "../config";
import type { Point } from "../pathfinding";

export interface Camera {
  /** Where the camera stands, in tiles. `z` is up. */
  x: number;
  y: number;
  z: number;
  /** Sine and cosine of the pitch, measured down from the horizontal. */
  sin: number;
  cos: number;
  focal: number;
  /** Principal point, in buffer pixels. */
  cx: number;
  cy: number;
  /** Buffer row the horizon falls on; nothing above it is ground. */
  horizon: number;
}

export interface Projected {
  sx: number;
  sy: number;
  /** Distance along the view direction. Negative is behind the camera. */
  depth: number;
}

/**
 * Stand the camera behind and above `focus` so that tile lands on `anchor`,
 * the buffer point the player is held at.
 */
export function cameraAt(
  focus: Point,
  anchor: Point,
  bufferWidth: number,
  bufferHeight: number,
): Camera {
  const pitch = (CAMERA_PITCH * Math.PI) / 180;
  const sin = Math.sin(pitch);
  const cos = Math.cos(pitch);
  const focal = Math.min(bufferWidth, bufferHeight) * FOCAL_TILES;
  const z = CAMERA_HEIGHT;

  // The ground directly under the camera lands this far below the horizon, and
  // everything below that row is behind the camera and cannot be drawn. Stand
  // further back until that row is off the bottom of the buffer, so a tall
  // window never opens a strip of void along its bottom edge.
  const nadir = (focal * cos) / sin;
  let back = CAMERA_BACK;
  while (back < CAMERA_BACK * 4) {
    const lift = (focal * (back * sin - z * cos)) / (back * cos + z * sin);
    if (anchor.y + lift + nadir >= bufferHeight) break;
    back += 0.25;
  }

  // Where the focus tile would land if the principal point were the origin.
  const depth = back * cos + z * sin;
  const up = back * sin - z * cos;

  return {
    x: focus.x,
    y: focus.y + back,
    z,
    sin,
    cos,
    focal,
    cx: anchor.x,
    cy: anchor.y + (focal * up) / depth,
    horizon: anchor.y + (focal * up) / depth - focal * (sin / cos),
  };
}

export function project(
  camera: Camera,
  x: number,
  y: number,
  z: number,
): Projected {
  const vx = x - camera.x;
  const vy = y - camera.y;
  const vz = z - camera.z;
  const depth = -vy * camera.cos - vz * camera.sin;
  const up = -vy * camera.sin + vz * camera.cos;
  return {
    sx: camera.cx + (camera.focal * vx) / depth,
    sy: camera.cy - (camera.focal * up) / depth,
    depth,
  };
}

/** How far along the view direction the ground under a buffer row lies. */
export function depthAtRow(camera: Camera, sy: number): number {
  const k = (camera.cy - sy) / camera.focal;
  const denominator = camera.sin - k * camera.cos;
  if (denominator <= 0) return Infinity;
  const forward = (camera.z * (camera.cos + k * camera.sin)) / denominator;
  if (forward < 0) return Infinity;
  return forward * camera.cos + camera.z * camera.sin;
}

/** The ground point a buffer pixel looks at, or null above the horizon. */
export function groundAt(camera: Camera, sx: number, sy: number): Point | null {
  const depth = depthAtRow(camera, sy);
  if (!Number.isFinite(depth)) return null;
  const forward = (depth - camera.z * camera.sin) / camera.cos;
  return {
    x: camera.x + ((sx - camera.cx) * depth) / camera.focal,
    y: camera.y - forward,
  };
}
