import eslint from "@eslint/js";
import sortImportPlugin from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tslint from "typescript-eslint";

export default tslint.config(
  {
    ignores: ["__snapshots__", "coverage", "dist", "node_modules"],
  },
  eslint.configs.recommended,
  ...tslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
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
  },
);
