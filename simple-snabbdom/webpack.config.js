module.exports = {
  entry: './index.js',
  output: {
    publicPath: 'cache',
    filename: 'bundle.js',
  },
  devServer: {
    port: 8084,
    contentBase: 'www'
  }
};