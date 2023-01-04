import { defineConfig } from "vite";
import marko from "@marko/vite";

const { NODE_ENV } = process.env;
const isProd = NODE_ENV === "production";

export default defineConfig({
  plugins: [
    marko(),
    {
      apply: "build",
      name: "worker-condition",
      config(options) {
        if (options.build.ssr && options.ssr?.target === "webworker") {
          // Add the `worker` export condition to tell Marko to load worker compatible stream apis.
          // Remove when https://github.com/vitejs/vite/issues/6401 is resolved.
          options.resolve = {
            conditions: ["worker"],
          };
        }

        return options;
      },
    },
  ],
  build: {
    minify: true,
    outDir: "dist", // Server and client builds should output assets to the same folder.
    emptyOutDir: false, // Avoid server / client deleting files from each other.
    assetsInlineLimit: 0, // This is currently a work around for loading the favicon since datauri does not work.
  },
  ssr: {
    target: "webworker",
    noExternal: isProd,
  }
});
