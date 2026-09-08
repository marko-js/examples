import { conflicts, drainRate, getPrayer, PRAYERS } from "./prayers";
import { xpForLevel } from "./skills";
import { advance, createTestEngine } from "./test-helpers";

test("the book holds the free-to-play prayers at their published levels", () => {
  expect(PRAYERS).toHaveLength(21);
  expect(getPrayer("thick_skin")).toMatchObject({ level: 1, seconds: 36 });
  expect(getPrayer("rock_skin")).toMatchObject({ level: 10, seconds: 6 });
  expect(getPrayer("steel_skin")).toMatchObject({ level: 28, seconds: 3 });
  expect(getPrayer("protect_from_melee")).toMatchObject({
    level: 43,
    seconds: 3,
    protect: "melee",
  });
  expect(getPrayer("mystic_might").level).toBe(45);
});

test("prayers in a group, and rival styles, put each other out", () => {
  const thick = getPrayer("thick_skin");
  const rock = getPrayer("rock_skin");
  const burst = getPrayer("burst_of_strength");
  const sharp = getPrayer("sharp_eye");

  expect(conflicts(rock, thick)).toBe(true);
  expect(conflicts(rock, burst)).toBe(false);
  expect(conflicts(sharp, burst)).toBe(true);
  expect(conflicts(thick, thick)).toBe(false);
});

test("lighting a prayer burns points at the rate it lists", () => {
  const engine = createTestEngine();
  const { player } = engine.state;
  engine.addXp("prayer", xpForLevel(31));
  expect(engine.maxPrayerPoints).toBe(31);
  player.prayerPoints = 31;

  engine.togglePrayer("ultimate_strength");
  expect(player.prayers).toEqual(["ultimate_strength"]);
  // A point every three seconds, so six seconds is two points.
  advance(engine, 6000);
  expect(player.prayerPoints).toBeCloseTo(29, 1);

  // Superhuman is the same group, so it replaces it.
  engine.togglePrayer("superhuman_strength");
  expect(player.prayers).toEqual(["superhuman_strength"]);
  expect(drainRate(player.prayers)).toBeCloseTo(1 / 6, 5);

  engine.togglePrayer("superhuman_strength");
  expect(player.prayers).toEqual([]);
});

test("a prayer above your level cannot be lit", () => {
  const engine = createTestEngine();
  engine.togglePrayer("steel_skin");
  expect(engine.state.player.prayers).toEqual([]);
  expect(engine.state.messages.at(-1)?.text).toBe(
    "You need Prayer level 28 for Steel Skin.",
  );
});

test("running out puts every prayer out", () => {
  const engine = createTestEngine();
  const { player } = engine.state;
  engine.addXp("prayer", xpForLevel(10));
  player.prayerPoints = 1;
  engine.togglePrayer("rock_skin");

  advance(engine, 7000);
  expect(player.prayerPoints).toBe(0);
  expect(player.prayers).toEqual([]);
  expect(engine.state.messages.at(-1)?.text).toBe(
    "You have run out of prayer points.",
  );
});
