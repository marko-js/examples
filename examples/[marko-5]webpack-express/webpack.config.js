const path = require("path");
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");
const CSSExtractPlugin = require("mini-css-extract-plugin");
const MarkoPlugin = require("@marko/webpack/plugin").default;
const SpawnServerPlugin = require("spawn-server-webpack-plugin");
const MinifyCSSPlugin = require("css-minimizer-webpack-plugin");

const markoPlugin = new MarkoPlugin();
const { NODE_ENV = "development" } = process.env;
const isDev = NODE_ENV === "development";
const isProd = !isDev;
const filenameTemplate = `${isProd ? "" : `[name].`}[contenthash:8]`;
const spawnedServer =
  isDev &&
  new SpawnServerPlugin({
    args: [
      "--enable-source-maps",
      // Allow debugging spawned server with the INSPECT=1 env var.
      process.env.INSPECT && "--inspect",
    ].filter(Boolean),
  });

module.exports = [
  compiler({
    name: "browser",
    target: "web",
    devtool: isProd
      ? "cheap-module-source-map"
      : "eval-cheap-module-source-map",
    output: {
      filename: `${filenameTemplate}.js`,
      path: path.join(__dirname, "dist/assets"),
    },
    optimization: {
      runtimeChunk: "single",
      splitChunks: {
        chunks: "all",
        maxInitialRequests: 3,
      },
    },
    devServer: isProd
      ? undefined
      : {
          hot: false,
          static: false,
          host: "0.0.0.0",
          allowedHosts: "all",
          port: parseInt(process.env.PORT || 3000, 10),
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
          ...spawnedServer.devServerConfig,
        },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [CSSExtractPlugin.loader, "css-loader"],
        },
        {
          test: /\.(jpg|jpeg|gif|png|svg)$/,
          type: "asset",
        },
      ],
    },
    plugins: [
      markoPlugin.browser,
      new webpack.DefinePlugin({
        "typeof window": "'object'",
      }),
      new CSSExtractPlugin({
        filename: `${filenameTemplate}.css`,
        ignoreOrder: true,
      }),
      isProd && new MinifyCSSPlugin(),
    ],
  }),
  compiler({
    name: "server",
    target: "async-node",
    devtool: "inline-nosources-cheap-module-source-map",
    externals: [
      // Exclude node_modules, but ensure non js files are bundled.
      // Eg: `.marko`, `.css`, etc.
      nodeExternals({
        allowlist: [/\.(?!(?:js|json)$)[^.]+$/],
      }),
    ],
    optimization: {
      minimize: false,
    },
    output: {
      libraryTarget: "commonjs2",
      path: path.join(__dirname, "dist"),
      devtoolModuleFilenameTemplate: "[absolute-resource-path]",
    },
    module: {
      rules: [
        {
          test: /\.(jpg|jpeg|gif|png|svg)$/,
          generator: { emit: false },
          type: "asset/resource",
        },
      ],
    },
    plugins: [
      spawnedServer,
      markoPlugin.server,
      new webpack.IgnorePlugin({
        resourceRegExp: /\.css$/,
      }),
      new webpack.DefinePlugin({
        "typeof window": "'undefined'",
      }),
    ],
  }),
];

// Shared config for both server and client compilers.
function compiler(config) {
  return {
    ...config,
    mode: isProd ? "production" : "development",
    stats: isDev && "minimal",
    cache: {
      type: "filesystem",
    },
    output: {
      ...config.output,
      publicPath: "/assets/",
      assetModuleFilename: `${filenameTemplate}[ext][query]`,
    },
    resolve: {
      extensions: [".js", ".json"],
    },
    module: {
      rules: [
        ...config.module.rules,
        {
          test: /\.marko$/,
          loader: "@marko/webpack/loader",
        },
      ],
    },
    plugins: config.plugins.filter(Boolean),
  };
}
