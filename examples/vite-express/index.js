const express = require("express");
const compressionMiddleware = require("compression");
const markoMiddleware = require("@marko/express").default;
const isProd = process.env.NODE_ENV === "production";
const port = process.env.PORT || 3000;

(async () => {
  const app = express()
    .use(compressionMiddleware()) // Enable gzip compression for all HTTP responses.
    .use(markoMiddleware());

  if (isProd) {
    app
      .use("/assets", express.static("dist/assets")) // Serve assets generated from vite.
      .use(require("./dist").default);
  } else {
    const devServer = await require("vite").createServer({
      server: { middlewareMode: true }
    });
    app.use(devServer.middlewares);
    app.use(async (req, res, next) =>
      (await devServer.ssrLoadModule("./src/index")).default(req, res, err => {
        if (err) {
          devServer.ssrFixStacktrace(err);
          next(err);
        } else {
          next();
        }
      })
    );
  }

  app.listen(port, err => {
    if (err) {
      throw err;
    }

    console.log(`Listening on port ${port}`);
  });
})();
