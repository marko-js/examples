import template from "./template.marko";

export default ctx => {
  ctx.type = "html";
  ctx.body = template.stream({
    name: "Frank",
    count: 30,
    colors: ["red", "green", "blue"]
  });
};
