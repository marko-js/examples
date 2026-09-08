import { MINIMAP_TILES } from "../config";
import { createTestEngine } from "../test-helpers";
import { minimapPointAt, minimapTileAt } from "./minimap";
import { defaultView, project } from "./projection";
import { cameraFor, viewportFor } from "./world";

const SIZE = 132;

test("a point on the minimap is the tile that draws there", () => {
  const engine = createTestEngine();
  const { state } = engine;
  // Part way through a step, which is when the two could drift apart.
  state.player.fx = state.player.x + 0.37;
  state.player.fy = state.player.y - 0.42;

  for (const yaw of [0, 0.6, Math.PI / 2, Math.PI, 5.1]) {
    for (const [dx, dy] of [
      [0, 0],
      [4, 0],
      [0, -6],
      [-3, 5],
      [9, 9],
    ]) {
      const tile = { x: state.player.x + dx, y: state.player.y + dy };
      // Aim at the middle of the tile, where a player aiming for it would.
      const spot = minimapPointAt(state, SIZE, tile.x + 0.5, tile.y + 0.5, yaw);
      const back = minimapTileAt(state, SIZE, spot.x, spot.y, yaw);
      expect(`yaw ${yaw.toFixed(1)}: ${back.x},${back.y}`).toBe(
        `yaw ${yaw.toFixed(1)}: ${tile.x},${tile.y}`,
      );
    }
  }
});

test("the player's own dot sits dead centre", () => {
  const engine = createTestEngine();
  const { state } = engine;
  state.player.fx = state.player.x + 0.4;
  state.player.fy = state.player.y - 0.3;
  for (const yaw of [0, 1.1, 4.4]) {
    const dot = minimapPointAt(
      state,
      SIZE,
      state.player.fx + 0.5,
      state.player.fy + 0.5,
      yaw,
    );
    expect(dot.x).toBeCloseTo(SIZE / 2, 6);
    expect(dot.y).toBeCloseTo(SIZE / 2, 6);
  }
});

test("the centre of the minimap is the tile the player stands on", () => {
  const engine = createTestEngine();
  const { player } = engine.state;
  for (const yaw of [0, 1.2, 3.9]) {
    expect(minimapTileAt(engine.state, SIZE, SIZE / 2, SIZE / 2, yaw)).toEqual({
      x: player.x,
      y: player.y,
    });
  }
});

test("the map turns the same way the camera does", () => {
  const engine = createTestEngine();
  const { state } = engine;
  const { player } = state;
  const view = viewportFor(400, 700);

  for (const yaw of [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2]) {
    const camera = cameraFor(state, view, { ...defaultView(), yaw });
    // A tile a few steps along the way the camera looks.
    const ahead = {
      x: player.x + Math.round(camera.fx * 4),
      y: player.y + Math.round(camera.fy * 4),
    };
    // It draws above the player in the world...
    const inWorld = project(camera, ahead.x + 0.5, ahead.y + 0.5, 0);
    const atPlayer = project(camera, player.x + 0.5, player.y + 0.5, 0);
    expect(inWorld.sy).toBeLessThan(atPlayer.sy);
    // ...so it must draw above the player on the map as well.
    const onMap = minimapPointAt(
      state,
      SIZE,
      ahead.x + 0.5,
      ahead.y + 0.5,
      yaw,
    );
    expect(`yaw ${yaw.toFixed(2)} above: ${onMap.y < SIZE / 2}`).toBe(
      `yaw ${yaw.toFixed(2)} above: true`,
    );
  }
});

test("the map covers the tiles it says it does", () => {
  const engine = createTestEngine();
  const { player } = engine.state;
  const edge = minimapTileAt(engine.state, SIZE, SIZE, SIZE / 2, 0);
  expect(edge.x - player.x).toBe(MINIMAP_TILES / 2);
});
