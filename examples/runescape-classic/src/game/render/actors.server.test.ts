import { type Motion, MOTIONS } from "../state";
import { poseFor, REST } from "./actors";

const MOTION_IDS = Object.keys(MOTIONS) as Motion[];

test("standing still is standing still", () => {
  expect(poseFor(null, 0, 0)).toEqual(REST);
});

test("walking swings the limbs whatever else is going on", () => {
  expect(poseFor(null, 0, 1.2).walk).toBe(1.2);
  // Work that needs both feet planted stops the walk cycle.
  expect(poseFor("chop", 0.3, 1.2).walk).toBe(0);
  expect(poseFor("cast", 0.3, 1.2).walk).toBe(0);
  // A flinch does not, since it can land while you are running away.
  expect(poseFor("flinch", 0.3, 1.2).walk).toBe(1.2);
});

test("every animation moves something, and settles by the end", () => {
  for (const motion of MOTION_IDS) {
    const moved = [0.15, 0.35, 0.55, 0.75].some((t) => {
      const pose = poseFor(motion, t, 0);
      return (
        Math.abs(pose.swing) +
          Math.abs(pose.lift) +
          Math.abs(pose.reach) +
          Math.abs(pose.crouch) +
          Math.abs(pose.lean) +
          pose.fall >
        0.02
      );
    });
    expect(`${motion} moves: ${moved}`).toBe(`${motion} moves: true`);
  }
});

test("a swing goes back, comes through, and returns", () => {
  const back = poseFor("swing", 0.2, 0);
  const through = poseFor("swing", 0.6, 0);
  expect(back.swing).toBeLessThan(0);
  expect(through.swing).toBeGreaterThan(0);
  expect(back.lift).toBeGreaterThan(0);
  expect(poseFor("swing", 0.99, 0).lift).toBeCloseTo(0, 1);
});

test("praying and lighting a fire crouch down and back up", () => {
  expect(poseFor("crouch", 0.5, 0).crouch).toBeCloseTo(1, 2);
  expect(poseFor("crouch", 0, 0).crouch).toBeCloseTo(0, 2);
  expect(poseFor("crouch", 1, 0).crouch).toBeCloseTo(0, 2);
});

test("a death tips all the way over and stays there", () => {
  expect(poseFor("death", 0, 0).fall).toBe(0);
  expect(poseFor("death", 0.5, 0).fall).toBeGreaterThan(0.5);
  expect(poseFor("death", 1, 0).fall).toBe(1);
});

test("the looping jobs are the ones that loop", () => {
  const looping = MOTION_IDS.filter((id) => MOTIONS[id].loop);
  expect(looping).toEqual(["chop", "mine", "fish"]);
  for (const id of MOTION_IDS) expect(MOTIONS[id].ms).toBeGreaterThan(0);
});
