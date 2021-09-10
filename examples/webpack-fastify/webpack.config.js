const path = require("path");
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");
const CSSExtractPlugin = require("mini-css-extract-plugin");
const MarkoPlugin = require("@marko/webpack/plugin").default;
const SpawnServerPlugin = require("spawn-server-webpack-plugin");
const MinifyCSSPlugin = require("css-minimizer-webpack-plugin");
const MinifyImagesPlugin = require("image-minimizer-webpack-plugin");

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
  ...["modern", isProd && "legacy"].filter(Boolean).map((env, i) => {
    return compiler({
      env,
      name: `browser:${env}`,
      target: `browserslist:${env}`,
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
      devServer:
        isDev && i === 0
          ? {
              hot: false,
              port: 8443,
              static: false,
              host: "0.0.0.0",
              allowedHosts: "all",
              headers: {
                "Access-Control-Allow-Origin": "*",
              },
              ...spawnedServer.devServerConfig,
            }
          : undefined,
      module: {
        rules: [
          {
            test: /\.css$/,
            use: [
              CSSExtractPlugin.loader,
              "css-loader",
              {
                loader: "postcss-loader",
                options: {
                  postcssOptions: {
                    env,
                  },
                },
              },
            ],
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
        isProd &&
          new MinifyImagesPlugin({
            minimizerOptions: {
              plugins: [
                "imagemin-gifsicle",
                "imagemin-jpegtran",
                "imagemin-optipng",
                "imagemin-svgo",
              ],
            },
          }),
      ],
    });
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
function compiler({ env, ...config }) {
  const publicPath = "/assets/";
  const babelConfig = {
    comments: false,
    compact: false,
    babelrc: false,
    caller: { env },
  };

  return {
    ...config,
    bail: true,
    mode: isProd ? "production" : "development",
    stats: isDev && "minimal",
    cache: {
      type: "filesystem",
    },
    output: {
      ...config.output,
      publicPath,
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
          options: { babelConfig },
        },
        {
          test: /\.js$/,
          loader: "babel-loader",
          exclude: /node_modules/,
          options: {
            cacheDirectory: true,
            ...babelConfig,
          },
        },
      ],
    },
    plugins: config.plugins.filter(Boolean),
  };
}
