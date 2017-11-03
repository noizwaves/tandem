const path = require('path');
const nodeExternals = require('webpack-node-externals');

const elmSource = path.resolve(__dirname);

module.exports = [{
  entry: {
    'app.web': [
      './reception/src/index.web.ts'
    ]
  },
  output: {
    path: path.resolve(__dirname + '/reception/dist'),
    filename: '[name].js',
  },

  module: {
    rules: [
      {
        test: /\.(css|scss)$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.html$/,
        exclude: /node_modules/,
        loader: 'file-loader?name=[name].[ext]',
      },
      {
        test: /\.elm$/,
        exclude: [/elm-stuff/, /node_modules/],
        loader: 'elm-webpack-loader?verbose=true&warn=true&cwd=' + elmSource,
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader?limit=10000&mimetype=application/font-woff',
      },
      {
        test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'file-loader',
      },
    ],

    noParse: /\.elm$/,
  },
  externals: [nodeExternals()]
}, {
  entry: {
    'app.electron': [
      './reception/src/index.electron.ts'
    ]
  },
  target: 'electron-renderer',

  output: {
    path: path.resolve(__dirname + '/reception/dist'),
    filename: '[name].js',
  },

  module: {
    rules: [
      {
        test: /\.(css|scss)$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.html$/,
        exclude: /node_modules/,
        loader: 'file-loader?name=[name].[ext]',
      },
      {
        test: /\.elm$/,
        exclude: [/elm-stuff/, /node_modules/],
        loader: 'elm-webpack-loader?verbose=true&warn=true&cwd=' + elmSource,
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader?limit=10000&mimetype=application/font-woff',
      },
      {
        test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'file-loader',
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader'
      }
    ],

    noParse: /\.elm$/,
  },
  externals: [nodeExternals()]
}, {
  entry: {
    'main': ['./main.ts']
  },
  target: 'electron-main',
  node: {
    __dirname: false,
    __filename: false
  },
  output: {
    path: path.resolve(__dirname) + '/',
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  externals: [nodeExternals()]
}, {
  entry: {
    'displaychampion': ['./displaychampion.ts']
  },
  target: 'electron-renderer',
  node: {
    __dirname: false,
    __filename: false
  },
  output: {
    path: path.resolve(__dirname) + '/',
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  externals: [nodeExternals()]
}];
