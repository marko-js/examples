/**
 * The camera the world is drawn through: a pinhole looking down on the ground
 * from behind the player, which the player can swing round, tilt and pull in.
 *
 * Whatever it is pointing at, a screen row still meets the ground along a
 * straight line, so the ground plane inverts exactly and a click lands on the
 * tile the player meant.
 */
import {
  CAMERA_BACK,
  CAMERA_HEIGHT,
  CAMERA_PITCH,
  FOCAL_TILES,
  MAX_PITCH,
  MAX_ZOOM,
  MIN_PITCH,
  MIN_ZOOM,
} from "../config";
import type { Point } from "../pathfinding";

/** Where the player has swung the camera to. Yaw is in radians, zoom a scale. */
export interface CameraView {
  yaw: number;
  pitch: number;
  zoom: number;
}

export function defaultView(): CameraView {
  return { yaw: 0, pitch: (CAMERA_PITCH * Math.PI) / 180, zoom: 1 };
}

/** Keep a view inside the range the camera can actually be pointed. */
export function clampView(view: CameraView): CameraView {
  const turn = Math.PI * 2;
  return {
    yaw: ((view.yaw % turn) + turn) % turn,
    pitch: Math.min(
      (MAX_PITCH * Math.PI) / 180,
      Math.max((MIN_PITCH * Math.PI) / 180, view.pitch),
    ),
    zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, view.zoom)),
  };
}

export interface Camera {
  /** Where the camera stands, in tiles. `z` is up. */
  x: number;
  y: number;
  z: number;
  /** Sine and cosine of the pitch, measured down from the horizontal. */
  sin: number;
  cos: number;
  /** The unit vector the camera looks along on the ground, and its right. */
  fx: number;
  fy: number;
  rx: number;
  ry: number;
  yaw: number;
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
  view: CameraView = defaultView(),
): Camera {
  const sin = Math.sin(view.pitch);
  const cos = Math.cos(view.pitch);
  const focal = Math.min(bufferWidth, bufferHeight) * FOCAL_TILES * view.zoom;
  const z = CAMERA_HEIGHT;

  // Yaw 0 looks north, and turns clockwise from there.
  const fx = Math.sin(view.yaw);
  const fy = -Math.cos(view.yaw);
  const rx = Math.cos(view.yaw);
  const ry = Math.sin(view.yaw);

  // The ground directly under the camera lands this far below the horizon, and
  // everything below that row is behind the camera and cannot be drawn. Stand
  // further back until that row is off the bottom of the buffer, so a tall
  // window never opens a strip of void along its bottom edge.
  const nadir = (focal * cos) / sin;
  let back = CAMERA_BACK;
  while (back < CAMERA_BACK * 6) {
    const lift = (focal * (back * sin - z * cos)) / (back * cos + z * sin);
    if (anchor.y + lift + nadir >= bufferHeight) break;
    back += 0.25;
  }

  // Where the focus tile would land if the principal point were the origin.
  const depth = back * cos + z * sin;
  const up = back * sin - z * cos;

  return {
    x: focus.x - fx * back,
    y: focus.y - fy * back,
    z,
    sin,
    cos,
    fx,
    fy,
    rx,
    ry,
    yaw: view.yaw,
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
  const along = vx * camera.fx + vy * camera.fy;
  const depth = along * camera.cos - vz * camera.sin;
  const up = along * camera.sin + vz * camera.cos;
  return {
    sx: camera.cx + (camera.focal * (vx * camera.rx + vy * camera.ry)) / depth,
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
  const across = ((sx - camera.cx) * depth) / camera.focal;
  return {
    x: camera.x + camera.fx * forward + camera.rx * across,
    y: camera.y + camera.fy * forward + camera.ry * across,
  };
}
