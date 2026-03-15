import type { RequestHandler } from "express";
import template from "./template.marko";

const handler: RequestHandler = (_req, res) => {
  template.render({}).pipe(res);
};

export default handler;
