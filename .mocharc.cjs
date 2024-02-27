module.exports = {
  'node-option': [
    'loader=ts-node/esm',
    // Mute node error: (node:29544) ExperimentalWarning: `--experimental-loader` may be removed in the future; instead use `register()`
    'no-warnings',
  ],
}
