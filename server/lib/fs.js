CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require('builders', 'utils')
{ Promise } = __.require 'lib', 'promises'
fs = require 'fs'

stat = Promise.promisify fs.stat

getContentLength = (src)->
  stat src
  .get 'size'

module.exports =
  readFile: Promise.promisify fs.readFile
  writeFile: Promise.promisify fs.writeFile
  createReadStream: fs.createReadStream
  mv: Promise.promisify fs.rename
  getContentLength: getContentLength
