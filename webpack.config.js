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
      publicPath: '/'
    },
    target: 'web', // Target environment (web for renderer process)
    devtool: isDevelopment ? 'eval-source-map' : 'source-map',
    devServer: {
      port: 3000, // Port for webpack-dev-server
      static: {
        directory: path.join(__dirname, 'dist'), // Serve static files from 'dist'
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
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
          },
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader', 'postcss-loader']
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
        }
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
      alias: {
        '@components': path.resolve(__dirname, 'src/components'),
        '@contexts': path.resolve(__dirname, 'src/contexts'),
        '@services': path.resolve(__dirname, 'src/services'),
        '@store': path.resolve(__dirname, 'src/store'),
        '@styles': path.resolve(__dirname, 'src/styles'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@lessons': path.resolve(__dirname, 'src/lessons'),
        '@assets': path.resolve(__dirname, 'assets')
      }
    },
  };
}; 