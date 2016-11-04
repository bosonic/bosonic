module.exports = {
  entry: {
    elements: './elements/src/index.js'
  },
  output: {
    path: './elements/lib',
    filename: 'bosonic.js'
  },
  module: {
    loaders: [
      //{ test: /\.css$/, loader: 'style!css' },
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' }
    ]
  }
};