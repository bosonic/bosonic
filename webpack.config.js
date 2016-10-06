module.exports = {
  entry: {
    vanilla: './src/index.js',
    react: './demo/react/index.js'
  },
  output: {
    path: './build',
    filename: 'bundle.[name].js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      }
    ]
  }
};