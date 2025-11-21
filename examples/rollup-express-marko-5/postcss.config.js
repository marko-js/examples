const presetEnv = require("postcss-preset-env");

module.exports = () => {
  return {
    plugins: [
      presetEnv()
    ]
  };
};
