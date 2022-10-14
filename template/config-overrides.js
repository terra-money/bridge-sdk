const webpack = require('webpack')

module.exports = function override(config, env) {
  console.log('override')
  let loaders = config.resolve
  loaders.fallback = {
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('buffer'),
    crypto: require.resolve('crypto-browserify'),
    path: require.resolve('path-browserify'),
  }

  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
  ]
  return config
}
