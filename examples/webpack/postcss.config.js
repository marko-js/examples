const browserslist = require("browserslist");
const presetEnv = require("postcss-preset-env");

module.exports = ({ options: { env } }) => ({
  plugins: [
    presetEnv({ browsers: browserslist(null, { env }) })
  ]
});
