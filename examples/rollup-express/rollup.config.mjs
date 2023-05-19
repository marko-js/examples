import fs from "fs";
import { builtinModules } from "module";
import nodeResolvePlugin from "@rollup/plugin-node-resolve";
import commonjsPlugin from "@rollup/plugin-commonjs";
import stylesPlugin from "@ironkinoko/rollup-plugin-styles";
import babelPlugin from "@rollup/plugin-babel";
import jsonPlugin from "@rollup/plugin-json";
import urlPlugin from "@rollup/plugin-url";
import runPlugin from "@rollup/plugin-run";
import markoPlugin from "@marko/rollup";

const pkg = JSON.parse(fs.readFileSync("./package.json", "utf8"));

const publicPath = "/static/";
const serverDist = "dist";
const clientDist = "dist/client";
const isWatch = !!process.env.ROLLUP_WATCH;
const isProd = process.env.NODE_ENV === "production";
const assetFileNames = "[name]_[hash][extname]";

export default (async () => [
  compiler("server", {
    input: "./src/index.js",
    output: {
      dir: serverDist,
      assetFileNames: `client/${assetFileNames}`,
      format: "cjs"
    },
    external: new RegExp(
      `^(.*\/node_modules\/)?(${[
        ...Object.keys(pkg.dependencies),
        ...builtinModules
      ]
        .map(it => it.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"))
        .join("|")})(\/.*)?$`
    ),
    plugins: [
      isWatch &&
        runPlugin({
          execArgv: ["--enable-source-maps"].concat(
            process.env.INSPECT ? "--inspect" : []
          )
        })
    ]
  }),
  compiler("browser", {
    output: {
      dir: clientDist,
      assetFileNames
    },
    plugins: [
      stylesPlugin({
        mode: ["extract", "bundle.css"],
        sourceMap: true,
        minimize: isProd,
        url: {
          publicPath,
          hash: assetFileNames
        }
      }),
      isWatch &&
        (await import("rollup-plugin-livereload")).default({ verbose: false }),
      isProd && (await import("@rollup/plugin-terser")).default()
    ]
  })
])();

function compiler(target, config) {
  const isBrowser = target === "browser";
  const babelConfig = {
    comments: false,
    compact: false,
    babelrc: false,
    caller: { target }
  };

  return {
    ...config,
    plugins: [
      markoPlugin[target]({ babelConfig }),
      nodeResolvePlugin({
        browser: isBrowser,
        preferBuiltins: !isBrowser
      }),
      commonjsPlugin(),
      babelPlugin({
        babelHelpers: "bundled",
        ...babelConfig
      }),
      jsonPlugin(),
      urlPlugin({
        publicPath,
        destDir: clientDist,
        fileName: assetFileNames
      }),
      ...config.plugins
    ]
  };
}
