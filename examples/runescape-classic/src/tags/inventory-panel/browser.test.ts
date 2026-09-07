import { fireEvent, render, screen } from "@marko/testing-library";

import { initialUi } from "../../game/ui";
import Template from "./index.marko";

const ui = initialUi();

test("shows one button per slot and reports which one was used", async () => {
  const used: number[] = [];
  await render(Template, {
    items: ui.inventory,
    selected: null,
    freeSlots: ui.freeSlots,
    onActivate: (slot: number) => used.push(slot),
    onMenu: () => {},
  });

  expect(screen.getAllByRole("button")).toHaveLength(30);
  expect(screen.getByText("24 free slots")).toBeInTheDocument();

  await fireEvent.click(screen.getByTitle(/^Bronze axe/));
  expect(used).toEqual([0]);
});

test("an empty slot cannot be clicked", async () => {
  await render(Template, {
    items: ui.inventory.map(() => null),
    selected: null,
    freeSlots: 30,
    onActivate: () => {},
    onMenu: () => {},
  });

  expect(screen.getAllByTitle("Empty slot")[0]).toBeDisabled();
  expect(screen.getByText("30 free slots")).toBeInTheDocument();
});
