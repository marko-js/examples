import type { StorybookConfig } from "@storybook/marko-vite";

export default {
  framework: "@storybook/marko-vite",
  stories: ["../src/**/{,*.}stories.ts"],
  addons: ["@storybook/addon-essentials"],
  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
} satisfies StorybookConfig;
