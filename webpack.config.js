const path = require('path');
const webpack = require('webpack');

/**
 * @type {import('webpack').Configuration}
 */
const extensionConfig = {
  target: 'node',
  mode: 'none',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  devtool: 'nosources-source-map',
  infrastructureLogging: {
    level: 'log'
  }
};

/**
 * @type {import('webpack').Configuration}
 */
const previewConfig = {
  target: 'web',
  mode: 'none',
  entry: './src/preview.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'preview.js',
    libraryTarget: 'var',
    library: 'InfographicPreview'
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      "path": false,
      "fs": false
    },
    extensionAlias: {
      '.js': ['.js', '.ts']
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      },
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false
        }
      }
    ]
  },
  plugins: [
    new webpack.NormalModuleReplacementPlugin(
      /measury/,
      function(resource) {
        // Provide empty module for measury to avoid build errors in browser context
        if (resource.context.includes('@antv/infographic')) {
          resource.request = path.resolve(__dirname, 'src/measury-stub.js');
        }
      }
    )
  ],
  devtool: 'nosources-source-map',
  infrastructureLogging: {
    level: 'log'
  }
};

module.exports = [extensionConfig, previewConfig];
