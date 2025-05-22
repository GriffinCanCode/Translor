const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const os = require('os');

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
    cache: {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename]
      }
    },
    infrastructureLogging: {
      level: 'warn', // Reduce logging output
    },
    stats: 'errors-warnings', // Only show errors and warnings in the console
    devServer: {
      port: 3003, // Port for webpack-dev-server
      static: {
        directory: path.join(process.cwd(), 'dist'), // Serve static files from 'dist'
      },
      hot: true,
      historyApiFallback: true, // For React Router
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      client: {
        logging: 'warn', // Reduce logging
        overlay: true,
      },
    },
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          parallel: true, // Use multi-process parallel running
          terserOptions: {
            parse: {
              ecma: 2020,
            },
            compress: {
              ecma: 2020,
              drop_console: isProduction,
              passes: 2,
              toplevel: true,
            },
            mangle: {
              safari10: true,
            },
            format: {
              comments: false,
              ecma: 2020,
            },
          },
          extractComments: false,
        }),
        new CssMinimizerPlugin({
          parallel: true, // Use multi-process parallel minification
        }),
      ],
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: Infinity,
        minSize: 20000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              // Create a separate chunk for each major vendor
              const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
              return `vendor.${packageName.replace('@', '')}`;
            },
          },
          cssStyles: {
            name: 'css-styles',
            test: /\.css$/,
            chunks: 'all',
            enforce: true,
          },
        },
      },
      runtimeChunk: 'single',
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules\/(?!(readable-stream)\/).*/,
          use: {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true, // Enable babel caching
              cacheCompression: false, // Disable compression for faster caching
            }
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
      // Define process for browser context - IMPORTANT: don't replace process object itself
      new webpack.DefinePlugin({
        'process.env': JSON.stringify(process.env),
        'process.browser': JSON.stringify(true),
        'process.version': JSON.stringify(process.version),
      }),
      // Use ProvidePlugin to ensure process is available
      new webpack.ProvidePlugin({
        process: 'process/browser',
      }),
      // Explicitly ignore Node.js modules for the renderer process
      new webpack.IgnorePlugin({
        resourceRegExp: /^winston|winston-daily-rotate-file|fs|path|os|electron$/,
        contextRegExp: /\/src\/utils\/logger\.js$/,
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
        '@assets': path.resolve(process.cwd(), 'assets'),
        'process/browser': path.resolve(process.cwd(), 'node_modules/process/browser.js')
      },
      // Add Node.js module fallbacks for browser environment
      fallback: {
        "path": false,
        "fs": false,
        "os": false,
        "util": false,
        "crypto": false,
        "stream": false,
        "http": false,
        "https": false,
        "zlib": false,
        "net": false,
        "tls": false,
        "process": require.resolve('process/browser')
      }
    },
  };
}; 