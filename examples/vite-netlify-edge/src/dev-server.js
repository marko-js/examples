import "./dev-env.js";
import { once } from "events";
import { Readable } from "stream";
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
      const webRes = await handler({
        url,
        params,
        request: new Request(url, {
          method: req.method,
          headers: req.headers,
          referrer: req.headers.referer || "",
          body: req.method === "POST" ? req : null,
        }),
      });

      res.statusCode = webRes.status;
      res.statusMessage = webRes.statusText;

      for (const [name, value] of webRes.headers) {
        res.setHeader(name, value);
      }

      if (webRes.body) {
        const readable = Readable.from(webRes.body);
        readable.pipe(res);
        await once(readable, "end");
      } else {
        res.end();
      }
    } catch (err) {
      devServer.ssrFixStacktrace(err);
      return next(err);
    }
  })
  .listen(process.env.PORT || 3000);

await once(server, "listening");
console.log(`Listening at: ${`http://localhost:${server.address().port}`}`);
