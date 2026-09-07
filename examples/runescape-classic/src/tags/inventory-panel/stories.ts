import type { Meta, Story } from "@storybook/marko";

import { initialUi } from "../../game/ui";
import Template, { type Input } from "./index.marko";

const ui = initialUi();

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
