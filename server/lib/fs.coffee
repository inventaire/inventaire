CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require('builders', 'utils')
{ Promise } = __.require 'lib', 'promises'
fs = require 'fs'
mv = require 'mv'
mime = require 'mime'

stat = Promise.promisify fs.stat

contentHeaders = (src)->
  stat src
  .then (data)->
    contentType = mime.lookup src
    # Add charset if it's known.
    charset = mime.charsets.lookup contentType
    if charset then contentType += "; charset=#{charset}"
    headers =
      'Content-Length': data.size
      'Content-Type': contentType
  .then _.Log('headers')
  .catch _.ErrorRethrow('content headers')

module.exports =
  readFile: Promise.promisify fs.readFile
  writeFile: Promise.promisify fs.writeFile
  createReadStream: fs.createReadStream
  mv: Promise.promisify mv
  contentHeaders: contentHeaders
