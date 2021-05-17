module.exports = {
  entry: './index.js',
  output: {
    publicPath: 'cache',
    filename: 'bundle.js',
  },
  devServer: {
    port: 8086,
    contentBase: 'www'
  }
};