const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = (env, argv) => ({
  name: 'bofh-rcon-gui',
  entry: {
    main: './index.js',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, 'dist/'),
    filename: '[name].[hash].js',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.RCONWEBAPI_ENDPOINT': JSON.stringify(argv.mode === 'development' ? '/endpoint' : process.env.RCONWEBAPI_ENDPOINT),
      'process.env.RCON_SERVER': JSON.stringify(process.env.RCON_SERVER),
    }),
    new HtmlWebpackPlugin({
      title: 'rcon',
    }),
    new MiniCssExtractPlugin({ filename: 'styles.css' }),
  ],
  devServer: {
    proxy: {
      '/endpoint': {
        target: process.env.RCONWEBAPI_ENDPOINT,
        pathRewrite: {'^/endpoint' : ''},
        changeOrigin: true,
        logLevel: 'debug',
      },
    },
  },
})
