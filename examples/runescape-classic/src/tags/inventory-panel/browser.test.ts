import { fireEvent, render, screen } from "@marko/testing-library";

import { addItem, createPlayer } from "../../game/state";
import { buildUi } from "../../game/ui";
import Template from "./index.marko";

function carrying(): ReturnType<typeof buildUi> {
  const player = createPlayer();
  addItem(player.inventory, "bronze_axe");
  addItem(player.inventory, "bread", 3);
  addItem(player.inventory, "coins", 50);
  return buildUi({
    player,
    messages: [],
    overlay: { kind: "none" },
    region: "Lumbridge",
  });
}

test("shows one button per slot and reports which one was used", async () => {
  const ui = carrying();
  const used: number[] = [];
  await render(Template, {
    items: ui.inventory,
    selected: null,
    freeSlots: ui.freeSlots,
    onActivate: (slot: number) => used.push(slot),
    onMenu: () => {},
  });

  expect(screen.getAllByRole("button")).toHaveLength(30);
  expect(screen.getByText(`${ui.freeSlots} free slots`)).toBeInTheDocument();
  expect(ui.freeSlots).toBe(25);

  await fireEvent.click(screen.getByTitle(/^Bronze axe/));
  expect(used).toEqual([0]);
});

test("an empty slot cannot be clicked", async () => {
  await render(Template, {
    items: new Array(30).fill(null),
    selected: null,
    freeSlots: 30,
    onActivate: () => {},
    onMenu: () => {},
  });

  expect(screen.getAllByTitle("Empty slot")[0]).toBeDisabled();
  expect(screen.getByText("30 free slots")).toBeInTheDocument();
});
