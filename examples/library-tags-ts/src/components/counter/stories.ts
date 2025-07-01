import type { Meta, Story } from "@storybook/marko";

import Template, { type Input } from "./index.marko";

export default {
  title: "Counter",
  component: Template,
  argTypes: {
    multiplier: {
      control: {
        type: "number",
      },
    },
  },
} as Meta<Input>;

export const Default: Story<Input> = {
  args: {},
};

export const Double: Story<Input> = {
  args: {
    multiplier: 2,
  },
};
