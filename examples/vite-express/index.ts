import { once } from "events";
import express from "express";

const APP_ENTRY = "./dist/index.js";
const { NODE_ENV = "development", PORT = 4173 } = process.env;
console.time("Start");

const app = express()
  .use("/assets", express.static("dist/assets"))
  .use((await import(APP_ENTRY)).router);

await once(app.listen(PORT), "listening");

console.timeEnd("Start");
console.log(`Env: ${NODE_ENV}`);
console.log(`Address: http://localhost:${PORT}`);
