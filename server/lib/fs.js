
const CONFIG = require('config')
const __ = CONFIG.universalPath
const { Promise } = __.require('lib', 'promises')
const fs = require('fs')

const stat = Promise.promisify(fs.stat)

const getContentLength = src => stat(src)
.get('size')

module.exports = {
  readFile: Promise.promisify(fs.readFile),
  writeFile: Promise.promisify(fs.writeFile),
  createReadStream: fs.createReadStream,
  mv: Promise.promisify(fs.rename),
  getContentLength
}
