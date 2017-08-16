CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require('builders', 'utils')
{ Promise } = __.require 'lib', 'promises'
fs = require 'fs'
mime = require 'mime'
request = require 'request'

methods = [
  'readFile'
  'writeFile'
  'stat'
  'rename'
]

aliases =
  exist: 'stat'
  move: 'rename'

for methodName in methods
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
  .catch _.ErrorRethrow('content headers')

exports.createReadStream = fs.createReadStream.bind(fs)
exports.downloadFile = (url, path)->
  file = fs.createWriteStream path
  request url
  .on 'response', (res)->
    { headers, body, statusCode, statusMessage } = res
    if statusCode < 400 then _.log [ body, statusCode ], "#{url} downloaded"
    else _.error [ body, headers ], "#{statusCode} - #{statusMessage}"
  .on 'error', _.Error('downloadFile')
  .pipe file
