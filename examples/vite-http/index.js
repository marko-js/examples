import { promisify } from "util";
const { NODE_ENV = "development", PORT = 3000 } = process.env;
let app;

console.time("Start");

if (NODE_ENV === "production") {
  // In production, simply start up the http server.
  const { createServer } = await import("http");
  const { default: createServe } = await import("serve-static");
  const { handler } = await import("./dist/server/index.js");
  const serve = createServe("dist/client", {
    index: false,
    immutable: true,
    maxAge: "365 days"
  })
  app = createServer((req, res) => {
    serve(req, res, (err) => {
      exitIfError(err);
      handler(req, res);
    })
  });
} else {
  // In dev we'll start a Vite dev server in middleware mode,
  // and forward requests to our http request handler.
  const { createServer } = await import("vite");
  const devServer = await createServer({
    server: { middlewareMode: "ssr" },
  });
  app = devServer.middlewares
    .use(async (req, res, next) => {
      try {
        const { handler } = await devServer.ssrLoadModule("./src/index.js");
        await handler(req, res, next);
      } catch (err) {
        devServer.ssrFixStacktrace(err);
        return next(err);
      }
    });

}

const server = app.listen(PORT, err => {
  exitIfError(err);
  console.timeEnd("Start");
  console.log(`Env: ${NODE_ENV}`);
  console.log(`Address: http://localhost:${server.address().port}`);
})

function exitIfError(err) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
}
