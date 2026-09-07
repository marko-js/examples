import type { Meta, Story } from "@storybook/marko";

import { initialUi } from "../../game/ui";
import Template, { type Input } from "./index.marko";

const ui = initialUi();

export default {
  title: "StatsPanel",
  component: Template,
  args: {
    skills: ui.skills,
    combatLevel: ui.combatLevel,
    totalLevel: ui.totalLevel,
    totalXp: ui.totalXp,
  },
} as Meta<Input>;

export const NewCharacter: Story<Input> = { args: {} };

export const PartlyTrained: Story<Input> = {
  args: {
    skills: ui.skills.map((skill) =>
      skill.id === "woodcut"
        ? {
            ...skill,
            level: 42,
            base: 42,
            xp: 61_512,
            toNextLevel: 6234,
            progress: 0.4,
          }
        : skill,
    ),
    combatLevel: 34,
    totalLevel: 121,
    totalXp: 184_320,
  },
};
