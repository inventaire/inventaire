module.exports = {
  extension: 'ts',
  'node-option': [
    'loader=tsx/esm',
    // Mute node error: (node:29544) ExperimentalWarning: `--experimental-loader` may be removed in the future; instead use `register()`
    'no-warnings',
  ],
}
