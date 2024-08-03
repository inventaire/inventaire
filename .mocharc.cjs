const nodeOptionsBeforeV20 = [
  'loader=tsx/esm',
  // Mute node error: (node:29544) ExperimentalWarning: `--experimental-loader` may be removed in the future; instead use `register()`
  'no-warnings',
]

const nodeOptionsFromV20 = [
  'import=tsx/esm',
]

const nodeVersion = parseInt(process.version.split('.')[0].slice(1))

module.exports = {
  extension: 'ts',
  'node-option': nodeVersion >= 20 ? nodeOptionsFromV20 : nodeOptionsBeforeV20,
}
