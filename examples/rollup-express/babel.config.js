module.exports = api => {
  const config = {
    presets: ["@babel/env"]
  };

  if (api.caller(it => it.target) === "server") {
    config.targets = { node: "current" };
  }

  return config;
};
