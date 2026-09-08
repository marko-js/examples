import { drawPerson, poseFor, REST } from "./actors";
import { cameraAt } from "./projection";
import type { CharacterLook } from "./sprites";

const LOOK: CharacterLook = {
  skin: "#d8a87a",
  hair: "#6b4a2a",
  shirt: "#9a4b3f",
  legs: "#3f4a63",
  height: 1,
};

const SIZE = 160;

/** Draw one figure and hand back which pixels it covered. */
function paint(pose: Parameters<typeof drawPerson>[5]): Uint8ClampedArray {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  const camera = cameraAt(
    { x: 10.5, y: 10.5 },
    { x: SIZE / 2, y: SIZE * 0.7 },
    SIZE,
    SIZE,
  );
  drawPerson(ctx, camera, { x: 10.5, y: 10.5 }, LOOK, 4, pose);
  return ctx.getImageData(0, 0, SIZE, SIZE).data;
}

/** Where the ink landed: how much, and the box it fills. */
function inked(pixels: Uint8ClampedArray) {
  let count = 0;
  let top = SIZE;
  let bottom = 0;
  let left = SIZE;
  let right = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 8) continue;
    const at = i / 4;
    const row = Math.floor(at / SIZE);
    const column = at % SIZE;
    count++;
    top = Math.min(top, row);
    bottom = Math.max(bottom, row);
    left = Math.min(left, column);
    right = Math.max(right, column);
  }
  return { count, top, bottom, left, right };
}

function differences(a: Uint8ClampedArray, b: Uint8ClampedArray): number {
  let changed = 0;
  for (let i = 0; i < a.length; i += 4) {
    if (a[i] !== b[i] || a[i + 3] !== b[i + 3]) changed++;
  }
  return changed;
}

test("a figure at rest puts ink on the canvas", () => {
  const rest = inked(paint(REST));
  expect(rest.count).toBeGreaterThan(50);
  expect(rest.bottom).toBeGreaterThan(rest.top);
});

test("swinging moves the figure, it does not just redraw it", () => {
  const rest = paint(REST);
  const back = paint(poseFor("swing", 0.2, 0));
  const through = paint(poseFor("swing", 0.6, 0));
  expect(differences(rest, back)).toBeGreaterThan(10);
  expect(differences(back, through)).toBeGreaterThan(10);
});

test("a death lays the figure out flat", () => {
  const standing = inked(paint(REST));
  const down = inked(paint(poseFor("death", 1, 0)));
  expect(down.count).toBeGreaterThan(20);
  // Flat on the ground: it no longer reaches as high as it stood.
  expect(down.top).toBeGreaterThan(standing.top);
});

test("crouching brings the figure down", () => {
  const standing = inked(paint(REST));
  const crouched = inked(paint(poseFor("crouch", 0.5, 0)));
  expect(crouched.top).toBeGreaterThan(standing.top);
});

test("casting throws the arms out in front", () => {
  const rest = paint(REST);
  const cast = paint(poseFor("cast", 0.5, 0));
  expect(differences(rest, cast)).toBeGreaterThan(10);
});
