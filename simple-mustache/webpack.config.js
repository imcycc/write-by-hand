module.exports = {
  entry: './index.js',
  output: {
    publicPath: 'cache',
    filename: 'bundle.js',
  },
  devServer: {
    port: 8085,
    contentBase: 'www'
  }
};