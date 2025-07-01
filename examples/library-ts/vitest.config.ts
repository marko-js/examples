import marko from "@marko/vite";
import { defineConfig } from "vitest/config";
const isCI = !!process.env.CI;

export default defineConfig({
  plugins: [marko()],
  test: {
    globals: true,
    coverage: {
      enabled: isCI,
      provider: "istanbul",
      include: ["src/**/*"],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "server",
          environment: "node",
          include: ["src/**/{,*.}server.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "browser",
          browser: {
            enabled: true,
            provider: isCI ? "playwright" : "preview",
            instances: [{ browser: "chromium" }],
          },
          include: ["src/**/{,*.}browser.test.ts"],
        },
      },
    ],
  },
});
