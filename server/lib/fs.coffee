CONFIG = require 'config'
__ = CONFIG.root
_ = __.require('builders', 'utils')
Promise = require 'bluebird'
fs = require 'fs'
mime = require 'mime'

methods = [
  'readFile'
  'writeFile'
  'stat'
  'rename'
]

aliases =
  exist: 'stat'
  move: 'rename'

methods.forEach (methodName)->
  exports[methodName] = Promise.promisify fs[methodName]

for k, v of aliases
  exports[k] = exports[v]


exports.contentHeaders = (src)->
  exports.stat src
  .then (stat)->
    contentType = mime.lookup src
    # Add charset if it's known.
    charset = mime.charsets.lookup contentType
    if charset then contentType += "; charset=#{charset}"
    headers =
      'Content-Length': stat.size
      'Content-Type': contentType
  .then _.Log('headers')
  .catch _.ErrorRethrow('headers')

exports.createReadStream = fs.createReadStream.bind(fs)