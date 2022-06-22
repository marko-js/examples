import zlib from "zlib";
import path from "path";
import fastify from "fastify";

export const app = fastify();

if (process.env.NODE_ENV === "production") {
  app.register(import("@fastify/compress"), {
    zlibOptions: {
      flush: zlib.constants.Z_SYNC_FLUSH,
    },
    brotliOptions: {
      flush: zlib.constants.BROTLI_OPERATION_FLUSH,
    },
  });

  app.register(import("@fastify/static"), {
    root: path.resolve("dist/assets"),
    prefix: "/assets",
  });
}

app.register(import("@marko/fastify"));
app.register(import("./pages/index"));
