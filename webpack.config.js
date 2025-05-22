const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';
  const isProduction = !isDevelopment;

  return {
    entry: {
      main: './src/index.js',
    },
    output: {
      path: path.resolve(process.cwd(), 'dist'), // Output directory for bundled files
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      publicPath: isProduction ? './' : '/',
      clean: true // Clean the output directory before emit
    },
    target: 'web', // Target environment (web for renderer process)
    devtool: isDevelopment ? 'eval-source-map' : 'source-map',
    devServer: {
      port: 3000, // Port for webpack-dev-server
      static: {
        directory: path.join(process.cwd(), 'dist'), // Serve static files from 'dist'
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
        // Add CSS minimizer for production builds
        new CssMinimizerPlugin(),
      ],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          cssStyles: {
            name: 'css-styles',
            test: /\.css$/,
            chunks: 'all',
            enforce: true,
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
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
              }
            },
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
      // Always include MiniCssExtractPlugin, but configure it based on environment
      new MiniCssExtractPlugin({
        filename: isProduction ? 'styles/[name].[contenthash].css' : 'styles/[name].css',
        chunkFilename: isProduction ? 'styles/[id].[contenthash].css' : 'styles/[id].css',
      }),
    ],
    resolve: {
      extensions: ['.js', '.jsx'],
      fullySpecified: false,
      alias: {
        '@components': path.resolve(process.cwd(), 'src/components'),
        '@contexts': path.resolve(process.cwd(), 'src/contexts'),
        '@services': path.resolve(process.cwd(), 'src/services'),
        '@store': path.resolve(process.cwd(), 'src/store'),
        '@styles': path.resolve(process.cwd(), 'src/styles'),
        '@utils': path.resolve(process.cwd(), 'src/utils'),
        '@lessons': path.resolve(process.cwd(), 'src/lessons'),
        '@assets': path.resolve(process.cwd(), 'assets')
      },
      // Add this to help with ES Module resolution
      fallback: {
        "path": false,
        "fs": false
      }
    },
  };
}; 