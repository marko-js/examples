import path from "path";
import fastify from "fastify";

export const app = fastify();

if (process.env.NODE_ENV === "production") {
  const { constants } = await import("zlib");
  app.register(import("fastify-compress"), {
    zlibOptions: {
      flush: constants.Z_SYNC_FLUSH,
    },
    brotliOptions: {
      flush: constants.BROTLI_OPERATION_FLUSH,
    },
  });

  app.register(import("fastify-static"), {
    root: path.resolve("dist/assets"),
    prefix: "/assets",
  });
}

app.register(import("@marko/fastify"));
app.register(import("./pages/index"));
