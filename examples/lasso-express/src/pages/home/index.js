import template from "./template.marko";

export default (req, res) => {
  res.marko(template, {
    name: "Frank",
    count: 30,
    colors: ["red", "green", "blue"]
  });
};
