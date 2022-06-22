import { defineConfig } from "vite";
import marko from "@marko/vite";

export default defineConfig({
  plugins: [marko()],
  build: {
    assetsInlineLimit: 0, // This is currently a work around for loading the favicon since datauri does not work.
    rollupOptions: {
      output: {
        // Output ESM for the server build also.
        // Remove when https://github.com/vitejs/vite/issues/2152 is resolved.
        format: "es",
      },
    },
  },
});
