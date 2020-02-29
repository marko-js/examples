const path = require("path");
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");
const MarkoPlugin = require("@marko/webpack/plugin").default;
const CSSExtractPlugin = require("mini-css-extract-plugin");
const SpawnServerPlugin = require("spawn-server-webpack-plugin");
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");

const { NODE_ENV } = process.env;
const isProd = NODE_ENV === "production";
const isDev = !isProd;
const markoPlugin = new MarkoPlugin();
const spawnedServer =
  isDev &&
  new SpawnServerPlugin({
    args: ["--inspect-brk", "--enable-source-maps"]
  });

module.exports = [
  ...["modern", isProd && "legacy"].filter(Boolean).map(name =>
    compiler({
      name,
      target: "web",
      devtool: "source-map",
      stats: isDev && "minimal",
      module: {
        rules: [{
          test: /\.(less|css)$/,
          use: [
            CSSExtractPlugin.loader,
            "css-loader",
            {
              loader: "postcss-loader",
              options: {
                config: {
                  ctx: {
                    env: name
                  }
                }
              }
            },
            "less-loader"
          ]
        }]
      },
      optimization: {
        splitChunks: {
          chunks: "all",
          maxInitialRequests: 3
        }
      },
      output: {
        filename: "[name].[contenthash:8].js",
        path: path.join(__dirname, "dist/client")
      },
      devServer: isDev
        ? {
            overlay: true,
            host: "0.0.0.0",
            contentBase: false,
            disableHostCheck: true,
            ...spawnedServer.devServerConfig
          }
        : undefined,
      plugins: [
        new webpack.DefinePlugin({
          "typeof window": "'object'"
        }),
        new CSSExtractPlugin({
          filename: "[name].[contenthash:8].css"
        }),
        isProd && new OptimizeCssAssetsPlugin(),
        markoPlugin.browser
      ]
    })
  ),
  compiler({
    name: "node",
    target: "async-node",
    devtool: "inline-source-map",
    externals: [
      // Exclude node_modules, but ensure non js files are bundled.
      // Eg: `.marko`, `.css`, etc.
      nodeExternals({
        whitelist: [/\.(?!(?:js|json)$)[^.]+$/]
      })
    ],
    module: {
      rules: [{
        test: /\.(less|css)$/,
        loader: "ignore-loader"
      }]
    },
    optimization: {
      minimize: false
    },
    output: {
      libraryTarget: "commonjs2",
      path: path.join(__dirname, "dist/server")
    },
    plugins: [
      new webpack.DefinePlugin({
        "typeof window": "'undefined'"
      }),
      isDev && spawnedServer,
      markoPlugin.server
    ]
  })
];

// Shared config for both server and client compilers.
function compiler(config) {
  const publicPath = "/assets/";
  const babelConfig = {
    caller: {
      target: config.target,
      compiler: config.name
    }
  };

  return {
    ...config,
    mode: isProd ? "production" : "development",
    output: {
      publicPath,
      ...config.output
    },
    resolve: {
      extensions: [".js", ".json", ".marko"]
    },
    module: {
      ...config.module,
      rules: [
        ...config.module.rules,
        {
          test: /\.marko$/,
          loader: "@marko/webpack/loader",
          options: { babelConfig }
        },
        {
          test: /\.js$/,
          loader: "babel-loader",
          options: babelConfig
        },
        {
          test: /\.svg/,
          loader: "svg-url-loader"
        },
        {
          test: /\.(jpg|jpeg|gif|png)$/,
          loader: "file-loader",
          options: {
            // File assets from server & browser compiler output to client folder.
            outputPath: "../client",
            publicPath
          }
        }
      ]
    },
    plugins: config.plugins.filter(Boolean)
  };
}
