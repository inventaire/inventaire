# retrieves pictures stocked on the server itself under the 'local' objectStorage mode
# to be used in development only

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
images_ = __.require 'lib', 'images'
promises_ = __.require 'lib', 'promises'
base = __.path 'client', 'public/uploads'
regex_ = __.require 'models', 'tests/regex'
urlBase = CONFIG.images.urlBase()

# images urls looks like /img/#{hash}.#{extension}"
# expect the pictures' files to be in #{base}

module.exports = (req, res, next)->
  filename = parseFilename req
  [ hash, extension, others... ] = filename.split '.'

  if others.length > 0
    return error_.bundle req, res, 'invalid image path', 400

  unless regex_.Sha1.test hash
    return error_.bundle req, res, 'invalid image hash', 400

  unless extension is 'jpg'
    return error_.bundle req, res, 'accepts jpg extension only', 400

  res.sendFile "#{base}/#{filename}"

parseFilename = (req)->
  { pathname } = req._parsedUrl
  filename = pathname.replace urlBase, ''
