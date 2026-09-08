import { CAMERA_PITCH } from "../config";
import { cameraAt, depthAtRow, groundAt, project } from "./projection";

const camera = cameraAt({ x: 100, y: 200 }, { x: 128, y: 300 }, 256, 480);

test("the tile the camera is trained on lands on the anchor", () => {
  const spot = project(camera, 100, 200, 0);
  expect(spot.sx).toBeCloseTo(128, 6);
  expect(spot.sy).toBeCloseTo(300, 6);
  expect(spot.depth).toBeGreaterThan(0);
});

test("the camera stands behind and above what it looks at", () => {
  expect(camera.y).toBeGreaterThan(200);
  expect(camera.x).toBe(100);
  expect(camera.z).toBeGreaterThan(0);
  expect(Math.atan2(camera.sin, camera.cos) * (180 / Math.PI)).toBeCloseTo(
    CAMERA_PITCH,
    6,
  );
});

test("a pixel unprojects to the ground point that projects back to it", () => {
  for (const [sx, sy] of [
    [128, 300],
    [20, 460],
    [240, 200],
    [0, 470],
  ]) {
    const ground = groundAt(camera, sx, sy);
    expect(ground).not.toBeNull();
    const back = project(camera, ground!.x, ground!.y, 0);
    expect(back.sx).toBeCloseTo(sx, 6);
    expect(back.sy).toBeCloseTo(sy, 6);
  }
});

test("nothing is ground at or above the horizon", () => {
  expect(groundAt(camera, 128, camera.horizon)).toBeNull();
  expect(groundAt(camera, 128, camera.horizon - 20)).toBeNull();
  expect(groundAt(camera, 128, camera.horizon + 1)).not.toBeNull();
  expect(depthAtRow(camera, camera.horizon)).toBe(Infinity);
});

test("the ground runs away from the camera down the screen", () => {
  const near = groundAt(camera, 128, 470)!;
  const far = groundAt(camera, 128, 320)!;
  // North is up, so further away is a smaller y.
  expect(far.y).toBeLessThan(near.y);
  expect(depthAtRow(camera, 320)).toBeGreaterThan(depthAtRow(camera, 470));
});

test("no row of the buffer looks behind the camera", () => {
  for (const height of [200, 346, 480, 900]) {
    const view = cameraAt(
      { x: 100, y: 200 },
      { x: 128, y: height * 0.64 },
      256,
      height,
    );
    expect(groundAt(view, 128, height - 1)).not.toBeNull();
  }
});

test("things further away are drawn smaller", () => {
  const near = project(camera, 100, 199, 0);
  const far = project(camera, 100, 180, 0);
  expect(far.depth).toBeGreaterThan(near.depth);
  const size = (depth: number) => camera.focal / depth;
  expect(size(far.depth)).toBeLessThan(size(near.depth));
});
