import type { Meta, Story } from "@storybook/marko";

import { addItem, createPlayer } from "../../game/state";
import { buildUi } from "../../game/ui";
import Template, { type Input } from "./index.marko";

const player = createPlayer();
for (const [id, count] of [
  ["bronze_axe", 1],
  ["bronze_pickaxe", 1],
  ["tinderbox", 1],
  ["small_net", 1],
  ["bread", 3],
  ["coins", 50],
] as const) {
  addItem(player.inventory, id, count);
}

const ui = buildUi({
  player,
  messages: [],
  overlay: { kind: "none" },
  region: "Lumbridge",
});

export default {
  title: "InventoryPanel",
  component: Template,
  args: {
    items: ui.inventory,
    selected: null,
    freeSlots: ui.freeSlots,
    onActivate() {},
    onMenu() {},
  },
} as Meta<Input>;

export const Default: Story<Input> = { args: {} };

export const WithSelection: Story<Input> = { args: { selected: 0 } };

export const Empty: Story<Input> = {
  args: { items: ui.inventory.map(() => null), freeSlots: 30 },
};
