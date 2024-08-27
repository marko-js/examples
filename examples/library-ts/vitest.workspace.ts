import { defineWorkspace } from "vitest/config";
const isCI = !!process.env.CI;

export default defineWorkspace([
  {
    extends: "vitest.config.ts",
    test: {
      name: "server",
      environment: "node",
      include: ["src/**/{,*.}server.test.ts"],
    },
  },
  {
    extends: "vitest.config.ts",
    test: {
      name: "browser",
      browser: {
        enabled: true,
        name: "chromium",
        provider: isCI ? "playwright" : "preview",
      },
      include: ["src/**/{,*.}browser.test.ts"],
    },
  },
]);
