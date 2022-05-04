import { once } from "events";
import { createServer } from "vite";

const devServer = await createServer({ server: { middlewareMode: "ssr" } });
const server = devServer.middlewares
  .use(async (req, res, next) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const { router } = await devServer.ssrLoadModule("./src/router.js");
      const match = router.find(url.pathname);
      if (!match) return next();

      // Copy all of the info from the web style Response to the node ServerResponse.
      const { handler, params } = match;
      const result = await handler({
        url,
        params
      });

      res.statusCode = result.statusCode;
      res.statusMessage = result.statusText;
      res.headers = result.headers;
      res.end(result.body);
    } catch (err) {
      devServer.ssrFixStacktrace(err);
      return next(err);
    }
  })
  .listen(process.env.PORT || 3000);

await once(server, "listening");
console.log(`Listening at: ${`http://localhost:${server.address().port}`}`);
