const { NODE_ENV = "development", PORT = 3000 } = process.env;
console.time("Start");

(async () => {
  let address;
  if (NODE_ENV === "production") {
    // In production, simply start up the fastify server.
    const { app } = await import("./dist/index.js");
    address = await app.listen(PORT);
  } else {
    // In dev we'll start a Vite dev server in middleware mode,
    // and forward requests to our fastify server.
    const { once } = await import("events");
    const { createServer } = await import("vite");
    const { middlewares, ssrLoadModule } = await createServer({
      server: { middlewareMode: "ssr" },
    });
    const server = middlewares
      .use(async (req, res) => {
        const { app } = await ssrLoadModule("./src/index.js");
        await app.ready();
        app.routing(req, res);
      })
      .listen(PORT);

    await once(server, "listening");
    address = `http://localhost:${server.address().port}`;
  }

  console.timeEnd("Start");
  console.log(`Env: ${NODE_ENV}`);
  console.log(`Address: ${address}`);
})();
