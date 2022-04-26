import { defineConfig } from "vite";
import marko from "@marko/vite";
import netlifyEdge from '@netlify/vite-plugin-netlify-edge'

const { NODE_ENV } = process.env;
const isProd = NODE_ENV === "production";

export default defineConfig({
  plugins: [
    marko(),
    netlifyEdge(),
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
    emptyOutDir: false, // Avoid server / client deleting files from each other.
  },
  ssr: {
    target: "webworker",
    noExternal: isProd,
  }
});
