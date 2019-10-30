const path = require("path");
const webpack = require("webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MarkoPlugin = require("@marko/webpack/plugin").default;
const CSSExtractPlugin = require("mini-css-extract-plugin");
const SpawnServerPlugin = require("spawn-server-webpack-plugin");
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");

const { NODE_ENV } = process.env;
const isProd = NODE_ENV === "production";
const isDev = !isProd;
const markoPlugin = new MarkoPlugin();
const spawnedServer = isDev && new SpawnServerPlugin();

module.exports = [
  compiler({
    name: "Client",
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
    devServer: isDev ? {
      overlay: true,
      stats: "minimal",
      contentBase: false,
      ...spawnedServer.devServerConfig
    }: undefined,
    plugins: [
      new webpack.DefinePlugin({
        "process.browser": true
      }),
      new CSSExtractPlugin({
        filename: "[name].[contenthash:8].css"
      }),
      isProd && new OptimizeCssAssetsPlugin(),
      markoPlugin.browser
    ]
  }),
  compiler({
    name: "Server",
    target: "async-node",
    externals: [/^[^./!]/], // excludes node_modules
    optimization: {
      minimize: false
    },
    output: {
      libraryTarget: "commonjs2",
      path: path.join(__dirname, "dist/server")
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.browser": undefined,
        "process.env.BUNDLE": true
      }),
      new webpack.BannerPlugin({
        banner: 'require("source-map-support").install();',
        raw: true
      }),
      new CSSExtractPlugin({
        filename: "[name].[contenthash:8].css"
      }),
      isDev && spawnedServer,
      markoPlugin.server
    ]
  })
];

// Shared config for both server and client compilers.
function compiler(config) {
  return {
    ...config,
    mode: isProd ? "production" : "development",
    devtool: isProd ? "source-map" : "inline-source-map",
    output: {
      publicPath: "/static/",
      ...config.output
    },
    resolve: {
      extensions: [".js", ".json", ".marko"]
    },
    module: {
      rules: [
        {
          test: /\.marko$/,
          loader: "@marko/webpack/loader"
        },
        {
          test: /\.(less|css)$/,
          use: [CSSExtractPlugin.loader, "css-loader", "less-loader"]
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
            outputPath: "../client"
          }
        }
      ]
    },
    plugins: [...config.plugins, isProd && new CleanWebpackPlugin()].filter(Boolean)
  };
}
