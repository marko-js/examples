const browserslist = require("browserslist");

module.exports = api => {
  return {
    presets: [
      [
        "@babel/env",
        {
          targets: api.caller(caller => caller.target === "web")
            ? api.caller(caller => caller.compiler === "modern")
              ? browserslist(null, { env: "modern" })
              : browserslist(null, { env: "legacy" })
            : "current node"
        }
      ]
    ]
  };
};
