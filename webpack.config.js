const path = require('path');
const webpack = require('webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const GitRevisionPlugin = require('git-revision-webpack-plugin');
const gitRevisionPlugin = new GitRevisionPlugin();

module.exports = [
  {
    mode: 'development',
    devtool: 'cheap-eval-source-map',
    entry: './src/server/cli.ts',
    target: 'node',
    stats: {
      // Ignore warnings due to dynamic module loading
      warningsFilter: [
        /node_modules\/yargs/,
        /node_modules\/mqtt/,
        /node_modules\/express/,
      ],
    },
    module: {
      rules: [
        {
          test: /node_modules[/\\]mqtt/i,
          use: [
            {
              loader: 'shebang-loader',
            },
          ],
        },
        {
          test: /\.(ts)$/,
          include: /src/,
          use: [
            {
              loader: 'babel-loader',
            },
          ],
        },
      ],
    },
    output: {
      path: path.resolve('./build'),
      filename: 'server.js',
    },
    plugins: [
      //new ForkTsCheckerWebpackPlugin(),
      gitRevisionPlugin,
      new webpack.DefinePlugin({
        '__COMMIT_HASH__': JSON.stringify(gitRevisionPlugin.commithash()),
      }),
    ],
  },
];
