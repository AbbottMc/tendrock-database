const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const envHelpers = require('./environment-helpers');
const scriptOutputFolderName = envHelpers.getScriptOutputFolderName();
const scriptEntry = envHelpers.getScriptEntry();
const projectName = envHelpers.getProjectName();

const libConfig = {
  // all options under `output.library` can be used here
  // name: 'vanilla-data',
  type: 'module',
  // umdNamedDefine: true,
};

module.exports = {
  mode: "none",
  entry: {
    Main: `./${scriptEntry}`,
    'vanilla_data': {
      import: './node_modules/@minecraft/vanilla-data/lib/index.js',
      library: libConfig
    }
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, scriptOutputFolderName)
  },
  experiments: {
    outputModule: true
  },
  externalsType: "module",
  externals: {
    "@minecraft/server": "@minecraft/server",
    "@minecraft/server-ui": "@minecraft/server-ui",
    "@minecraft/vanilla-data": "./vanilla_data"
  },
  optimization: {
    minimize: false,
    minimizer: [
      new TerserPlugin({
        test: /\.js(\?.*)?$/i,
        terserOptions: {
          ecma: 6,
          parse: {},
          compress: {},
          mangle: true,
          module: true,
          toplevel: true,
          format: {
            comments: false
          }
        },
      }),
    ],
    usedExports: true, // 表示输出结果中只导出那些在外部使用了的成员
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', {modules: false}],
            plugins: ["@babel/plugin-transform-runtime"],
            cacheDirectory: true
          }
        }
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    plugins: [
      new TsconfigPathsPlugin()
    ],
    extensions: ['.tsx', '.ts', '.js'],
  }
};