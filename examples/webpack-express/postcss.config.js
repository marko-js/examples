const browserslist = require("browserslist");
const presetEnv = require("postcss-preset-env");

module.exports = ({ options: { env } }) => {
  return {
    plugins: [
      presetEnv({
        browsers: browserslist(null, { env })
      })
    ]
  };
};
