const { stat } = require('fs').promises
const { promisify } = require('util')
const mv = require('mv')

module.exports = {
  mv: promisify(mv),
  getContentLength: src => stat(src).then(({ size }) => size)
}
