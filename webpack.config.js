const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';
  const isProduction = !isDevelopment;

  return {
    entry: './src/index.js', // Entry point of your React app
    output: {
      path: path.resolve(__dirname, 'dist'), // Output directory for bundled files
      filename: isProduction ? '[name].[contenthash].js' : 'bundle.js',
      publicPath: isProduction ? './' : '/',
      clean: true // Clean the output directory before emit
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
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction,
            },
            format: {
              comments: false,
            },
          },
          extractComments: false,
        }),
      ],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
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
          use: [
            isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader'
          ]
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
        minify: isProduction ? {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: true,
          minifyCSS: true,
          minifyURLs: true,
        } : false,
      }),
      isProduction && new MiniCssExtractPlugin({
        filename: '[name].[contenthash].css',
        chunkFilename: '[id].[contenthash].css',
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