import { defineConfig } from "vite";
import marko from "@marko/vite";
export default defineConfig({
  plugins: [marko()],
  build: {
    outDir: "dist", // Server and client builds should output assets to the same folder.
    emptyOutDir: false // Avoid server / client deleting files from each other.
  }
});
