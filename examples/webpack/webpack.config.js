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
    args: [
      "--enable-source-maps"
      // Allow debugging spawned server with the INSPECT_SERVER=1 env var.
    ].concat(process.env.INSPECT_SERVER ? "--inspect-brk" : [])
  });

module.exports = [
  ...["modern", isProd && "legacy"].filter(Boolean).map(browserEnv => {
    const filenameTemplate = `${
      isProd ? "[id]" : `[name].${browserEnv}`
    }.[contenthash:8]`;
    return compiler({
      name: browserEnv,
      target: "web",
      devtool: "source-map",
      stats: isDev && "minimal",
      module: {
        rules: [
          {
            test: /\.(less|css)$/,
            use: [
              CSSExtractPlugin.loader,
              "css-loader",
              "postcss-loader",
              "less-loader"
            ]
          }
        ]
      },
      optimization: {
        splitChunks: {
          chunks: "all",
          maxInitialRequests: 3
        }
      },
      output: {
        filename: `${filenameTemplate}.js`,
        path: path.join(__dirname, "dist/client")
      },
      devServer: isDev
        ? {
            overlay: true,
            host: "0.0.0.0",
            contentBase: false,
            disableHostCheck: true,
            headers: { "Access-Control-Allow-Origin": "*" },
            ...spawnedServer.devServerConfig
          }
        : undefined,
      plugins: [
        new webpack.DefinePlugin({
          "typeof window": "'object'"
        }),
        new CSSExtractPlugin({
          filename: `${filenameTemplate}.css`
        }),
        isProd && new OptimizeCssAssetsPlugin(),
        markoPlugin.browser
      ]
    });
  }),
  compiler({
    name: "node",
    target: "async-node",
    devtool: 'inline-nosources-source-map',
    externals: [
      // Exclude node_modules, but ensure non js files are bundled.
      // Eg: `.marko`, `.css`, etc.
      nodeExternals({
        allowlist: [/\.(?!(?:js|json)$)[^.]+$/]
      })
    ],
    module: {
      rules: [
        {
          test: /\.(less|css)$/,
          loader: "ignore-loader"
        }
      ]
    },
    optimization: {
      minimize: false
    },
    output: {
      libraryTarget: "commonjs2",
      path: path.join(__dirname, "dist/server"),
      devtoolModuleFilenameTemplate: "[absolute-resource-path]"
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
    bail: true,
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
          exclude: /node_modules/,
          options: {
            cacheDirectory: true,
            ...babelConfig
          }
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
