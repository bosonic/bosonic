var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: [
    './react/demo/src/index.js'
  ],
  output: {
    path: "build",
    publicPath: "/",
    filename: "index.js"
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      template: "react/demo/public/index.html"
    })
  ],
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style!css' },
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' }
    ]
  }
};