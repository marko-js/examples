import { send } from "./send";
import template from "./template.marko";

export async function handler(req, res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=UTF-8');
  send(res, template.stream());
}
