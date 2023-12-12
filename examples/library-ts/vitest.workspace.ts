import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  {
    extends: "vitest.config.ts",
    test: {
      name: "server",
      environment: "node",
      include: ["src/**/{,*.}server.test.ts"],
      setupFiles: ["@testing-library/jest-dom/vitest"],
    },
  },
  {
    extends: "vitest.config.ts",
    test: {
      name: "browser",
      environment: "jsdom",
      include: ["src/**/{,*.}browser.test.ts"],
      setupFiles: ["@testing-library/jest-dom/vitest"],
    },
  },
]);
