import Template from "./template.marko";

export default (req, reply) => {
  reply.marko(Template, {
    name: "Frank",
    count: 30,
    colors: ["red", "green", "blue"]
  });
};
