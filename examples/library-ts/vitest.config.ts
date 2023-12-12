import marko from "@marko/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [marko()],
  test: {
    globals: true,
    coverage: {
      include: ["src/**/*"],
    },
  },
});
