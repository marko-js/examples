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
            instances: [{ browser: "chromium" }],
            provider: isCI
              ? (await import("@vitest/browser-playwright")).playwright()
              : (await import("@vitest/browser-preview")).preview(),
          },
          include: ["src/**/{,*.}browser.test.ts"],
        },
      },
    ],
  },
});
