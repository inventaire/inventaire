# retrieves pictures stocked on the server itself under the 'local' mediaStorage mode
# to be used in development only

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
images_ = __.require 'lib', 'images'
promises_ = __.require 'lib', 'promises'
regex_ = __.require 'models', 'validations/regex'
{ local: localStorage } = CONFIG.mediaStorage
urlBase = localStorage.urlBase()
storageFolder = localStorage.folder()

# images urls look like /img/#{hash}.#{extension}"
# expect the pictures' files to be in #{storageFolder}

exports.get = (req, res, next)->
  filename = parseFilename req
  [ hash, extension, others... ] = filename.split '.'

  if others.length > 0
    return error_.bundle req, res, 'invalid image path', 400

  unless regex_.Sha1.test hash
    return error_.bundle req, res, 'invalid image hash', 400

  # unless extension is 'jpg'
    # return error_.bundle req, res, 'accepts jpg extension only', 400

  filepath = "#{storageFolder}/#{filename}"

  options =
    headers:
      'Content-Type': 'image/jpeg'

  res.sendFile filepath, options, (err)->
    if err? then _.error err, "failed to send #{filepath}"

parseFilename = (req)->
  { pathname } = req._parsedUrl
  filename = pathname.replace urlBase, ''
