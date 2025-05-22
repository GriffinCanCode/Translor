const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';

  return {
    entry: './src/index.js', // Entry point of your React app
    output: {
      path: path.resolve(__dirname, 'dist'), // Output directory for bundled files
      filename: 'bundle.js',
      publicPath: isDevelopment ? '/' : './', // Correct publicPath for dev vs prod
    },
    target: 'web', // Target environment (web for renderer process)
    devtool: isDevelopment ? 'eval-source-map' : 'source-map',
    devServer: {
      port: 8080, // Port for webpack-dev-server
      static: {
        directory: path.join(__dirname, 'public'), // Serve static files from 'public'
      },
      hot: true,
      historyApiFallback: true, // For React Router
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    },
    module: {
      rules: [
        {
          test: /\.js|jsx$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react'],
            },
          },
        },
        {
          test: /\.css$/i,
          use: [
            isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader'
          ],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html', // Path to your source HTML file
        filename: 'index.html',
      }),
      !isDevelopment && new MiniCssExtractPlugin({
        filename: 'styles.css',
      }),
    ].filter(Boolean),
    resolve: {
      extensions: ['.js', '.jsx'],
    },
  };
}; 