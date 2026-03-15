import type { Request, Response } from "express";
import { type Connect, defineConfig } from "vite";
import marko from "@marko/vite";

type App = Promise<typeof import("./src/index.ts")>;

const DEV_ENTRY = "./src/index.ts";
const PROD_ENTRY = import.meta.resolve("./dist/index.js");

export default defineConfig({
  build: {
    ssr: DEV_ENTRY,
    sourcemap: true, // Generate sourcemaps for all builds.
    emptyOutDir: false, // Avoid server & client deleting files from each other.
  },
  plugins: [
    marko(),
    {
      name: "preview",
      configureServer(server) {
        server.middlewares.use(
          render(() => server.ssrLoadModule(DEV_ENTRY) as App),
        );
      },
      configurePreviewServer(server) {
        server.middlewares.use(render(() => import(PROD_ENTRY) as App));
      },
    },
  ],
});

function render(app: () => App): Connect.NextHandleFunction {
  return (req, res, next) =>
    app()
      .then(({ router }) => router(req as Request, res as Response, next))
      .catch(next);
}
