const browserslist = require("browserslist");

module.exports = api => {
  const env = api.caller(it => it.env);

  return {
    presets: [
      [
        "@babel/env",
        {
          targets: env ? browserslist(null, { env }) : "current node"
        }
      ]
    ]
  };
};
