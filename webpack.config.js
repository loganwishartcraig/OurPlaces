module.exports = {
  entry: "./src/entry.js",
  output: {
    path: __dirname + '/public/js',
    filename: "bundle.js"
  },
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: "babel-loader",
      query: {
        plugins: ['transform-runtime'],
        presets: ['es2015'],
      }
    }]
  }
};
