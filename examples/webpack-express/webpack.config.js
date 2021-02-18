const path = require("path");
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");
const MarkoPlugin = require("@marko/webpack/plugin").default;
const CSSExtractPlugin = require("mini-css-extract-plugin");
const SpawnServerPlugin = require("spawn-server-webpack-plugin");
const MinifyCSSPlugin = require("css-minimizer-webpack-plugin");

const { NODE_ENV } = process.env;
const isProd = NODE_ENV === "production";
const isDev = !isProd;
const markoPlugin = new MarkoPlugin();
const spawnedServer =
  isDev &&
  new SpawnServerPlugin({
    args: [
      "--enable-source-maps"
      // Allow debugging spawned server with the INSPECT=1 env var.
    ].concat(process.env.INSPECT ? "--inspect" : [])
  });

module.exports = [
  ...["modern", isProd && "legacy"].filter(Boolean).map((env, i) => {
    const filenameTemplate = `${isProd ? "" : `[name].${env}.`}[contenthash:8]`;
    return compiler({
      env,
      name: `browser:${env}`,
      target: `browserslist:${env}`,
      devtool: isProd
        ? "cheap-module-source-map"
        : "eval-cheap-module-source-map",
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
                    env
                  }
                }
              }
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
      devServer:
        isDev && i === 0
          ? {
              port: 3000,
              overlay: true,
              host: "0.0.0.0",
              contentBase: false,
              disableHostCheck: true,
              headers: { "Access-Control-Allow-Origin": "*" },
              injectClient: ({ name }) => name.startsWith("browser"),
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
        isProd && new MinifyCSSPlugin(),
        markoPlugin.browser
      ]
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
        allowlist: [/\.(?!(?:js|json)$)[^.]+$/]
      })
    ],
    module: {
      rules: [
        {
          test: /\.css$/,
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
function compiler({ env, ...config }) {
  const publicPath = "/static/";
  const babelConfig = {
    comments: false,
    compact: false,
    babelrc: false,
    caller: { env }
  };

  return {
    ...config,
    mode: isProd ? "production" : "development",
    stats: isDev && "minimal",
    cache: {
      type: "filesystem"
    },
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
