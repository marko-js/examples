import { defineConfig } from "vite";
import marko from "@marko/vite";

const { NODE_ENV } = process.env;
const isProd = NODE_ENV === "production";

export default defineConfig({
  plugins: [
    marko(),
    {
      apply: "build",
      name: "netlify",
      config(options) {
        if (options.build.ssr && isProd) {
          options.build.outDir = "netlify/functions"
        }
        return options;
      },
    },
  ],
  build: {
    minify: true,
    outDir: "netlify", // Server and client builds should output assets to the same folder.
    emptyOutDir: false, // Avoid server / client deleting files from each other.
  },
  ssr: {
    noExternal: isProd
  }
});
