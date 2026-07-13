import type { Meta, Story } from "@storybook/marko";

import Template, { type Input } from "./index.marko";

export default {
  title: "CharCount",
  component: Template,
  args: { name: "message", max: 50, placeholder: "Say hello…" },
} as Meta<Input>;

export const Default: Story<Input> = { args: {} };

export const ShortLimit: Story<Input> = { args: { max: 10 } };
