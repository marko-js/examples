import type { Meta, Story } from "@storybook/marko";

import Template, { type Input } from "./index.marko";

export default {
  title: "ChatBox",
  component: Template,
  args: {
    messages: [
      { id: 1, tone: "game", text: "Welcome to RuneScape Classic." },
      { id: 2, tone: "skill", text: "You get some logs." },
      { id: 3, tone: "combat", text: "You have defeated the goblin." },
      { id: 4, tone: "quest", text: "You have reached Woodcut level 15!" },
      { id: 5, tone: "chat", text: "Guest: hello world" },
    ],
    onSay() {},
  },
} as Meta<Input>;

export const Default: Story<Input> = { args: {} };

export const Quiet: Story<Input> = { args: { messages: [] } };
