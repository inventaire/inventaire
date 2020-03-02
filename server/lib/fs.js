const { rename, stat } = require('fs').promises

module.exports = {
  mv: rename,
  getContentLength: src => stat(src).then(({ size }) => size)
}
