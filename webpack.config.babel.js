/* eslint-disable import/no-extraneous-dependencies */
import webpack from 'webpack';
import path from 'path';

export default {
  output: {
    filename: '[name].min.js',
    path: path.join(__dirname, '/dist'),
    publicPath: '/dist',
  },
  devtool: 'eval-source-map',
  entry: {
    example: [
      'babel-polyfill',
      './example/index.js',
    ],
  },
  resolve: {
    alias: {
      pivoter: path.join(__dirname, 'src/index.js'),
    },
  },
  module: {
    loaders: [
      { test: /\.jsx?$/, loader: 'babel', exclude: /node_modules/ },
      { test: /\.json$/, loader: 'json', exclude: /node_modules/ },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('development'),
      },
    }),
  ],
};
