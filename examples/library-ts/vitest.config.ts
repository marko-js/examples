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
  },
});
