const { stat, unlink } = require('fs').promises
const { promisify } = require('util')
const mv = require('mv')

module.exports = {
  mv: promisify(mv),
  // Using 'unlink' instead of 'rm' until the minimal node version gets above v14.14.0
  // See https://nodejs.org/api/fs.html#fs_fspromises_rm_path_options
  rm: unlink,
  getContentLength: src => stat(src).then(({ size }) => size)
}
