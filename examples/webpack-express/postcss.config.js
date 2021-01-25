const browserslist = require("browserslist");
const presetEnv = require("postcss-preset-env");

module.exports = ({ webpackLoaderContext }) => {
  // Find the root webpack compiler, since CSS is handled via the extract css child compiler.
  let compiler = webpackLoaderContext._compiler;

  while (compiler.parentCompilation) {
    compiler = compiler.parentCompilation;
  }

  return {
    plugins: [
      presetEnv({ browsers: browserslist(null, { env: compiler.name }) })
    ]
  };
};
