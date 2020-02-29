import { matchesUA } from "browserslist-useragent";
import template from "./template.marko";

export default (req, res) => {
  const buildName = matchesUA(req.headers["user-agent"], {
    env: "modern",
    allowHigherVersions: true
  })
    ? "modern"
    : "legacy";

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  template.render({ $global: { buildName } }, res);
};
