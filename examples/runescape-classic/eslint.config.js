import { defineConfig, globalIgnores } from "eslint/config";

import js from "@eslint/js";
import css from "@eslint/css";
import ts from "typescript-eslint";
import globals from "globals";
import sortImportPlugin from "eslint-plugin-simple-import-sort";

export default defineConfig([
  globalIgnores([
    ".marko-run",
    "__snapshots__",
    "coverage",
    "dist",
    "node_modules",
  ]),
  {
    files: ["**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.vitest,
        ...globals.node,
      },
    },
    plugins: {
      "simple-import-sort": sortImportPlugin,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
    extends: [js.configs.recommended, ts.configs.recommended],
  },
  {
    files: ["**/*.css"],
    language: "css/css",
    plugins: { css },
    rules: {
      // Design tokens are declared in the layout, which this rule cannot see.
      "css/no-invalid-properties": ["error", { allowUnknownVariables: true }],
      // The touch handling this game needs (overscroll-behavior, user-select)
      // is newly baseline rather than widely.
      "css/use-baseline": ["error", { available: "newly" }],
    },
    extends: [css.configs.recommended],
  },
]);
