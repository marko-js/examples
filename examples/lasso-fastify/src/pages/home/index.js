import template from "./template.marko";

export default (req, reply) => {
  reply.header('Content-Type', 'text/html; charset=utf-8')
  reply.send(template.stream({
    name: "Frank",
    count: 30,
    colors: ["red", "green", "blue"]
  }));
};
