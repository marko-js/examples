import template from "./template.marko";

export default (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  template.render({}, res);
};
