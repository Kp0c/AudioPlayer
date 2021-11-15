const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
  target: 'web',
  entry: './src/js/index.js',
  mode: 'development',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {},
  plugins: [
    new CopyPlugin({
      patterns: [
        {from: 'src/index.css', to: '.'},
        {from: 'src/index.html', to: '.'},
        {from: 'assets', to: 'assets/'},
      ],
    }),
  ],
};
