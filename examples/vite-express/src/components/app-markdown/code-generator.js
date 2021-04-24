const marked = require("marked");

module.exports = function(path, t) {
  const bodyText = removeIndentation(path.get("body.body.0.value").node);
  const html = marked(bodyText);
  path.replaceWith(t.markoPlaceholder(t.stringLiteral(html), false));
};

function removeIndentation(str) {
  const indentMatches = /\s*\n(\s+)/.exec(str);
  if (indentMatches) {
    const indent = indentMatches[1];
    str = str.replace(new RegExp("^" + indent, "mg"), "");
  }
  return str;
}
