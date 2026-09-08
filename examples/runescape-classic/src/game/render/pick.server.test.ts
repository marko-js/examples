import { createTestEngine, npcOf } from "../test-helpers";
import { cameraFor, pickTile, tileAtScreen, viewportFor } from "./world";

const view = viewportFor(480, 800);

test("a click on a character picks them, not the ground behind them", () => {
  const engine = createTestEngine();
  const { player } = engine.state;
  const guide = npcOf(engine, "gielinor_guide");

  // Stand the guide two tiles north of the player, in plain view.
  guide.x = player.x;
  guide.y = player.y - 2;
  guide.fx = guide.x;
  guide.fy = guide.y;

  const camera = cameraFor(engine.state, view);
  const feet = { ...guide };
  const spot = { x: 0, y: 0 };
  // Find where the guide's feet land, then aim a tile up their body.
  for (let sy = 0; sy < 800; sy++) {
    const tile = tileAtScreen(camera, view, view.focus.x, sy);
    if (tile.x === feet.x && tile.y === feet.y) {
      spot.x = view.focus.x;
      spot.y = sy;
      break;
    }
  }
  expect(spot.y).toBeGreaterThan(0);

  const chest = spot.y - 30;
  // The ground under the chest is a different tile; the pick still finds them.
  expect(tileAtScreen(camera, view, spot.x, chest)).not.toEqual({
    x: guide.x,
    y: guide.y,
  });
  expect(pickTile(engine.state, camera, view, spot.x, chest)).toEqual({
    x: guide.x,
    y: guide.y,
  });
});

test("a click on open ground still picks the ground", () => {
  const engine = createTestEngine();
  const camera = cameraFor(engine.state, view);
  const at = { x: view.focus.x, y: 780 };
  expect(pickTile(engine.state, camera, view, at.x, at.y)).toEqual(
    tileAtScreen(camera, view, at.x, at.y),
  );
});
