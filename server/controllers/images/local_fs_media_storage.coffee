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
storageFolder = localStorage.folder()

# images urls look like /img/#{container}/#{hash}"
# expect the pictures' files to be in #{storageFolder}

exports.get = (req, res, next)->
  { pathname } = req._parsedUrl
  [ container, filename ] = pathname.split('/').slice(2)
  [ hash, extension, others... ] = filename.split '.'

  if others.length > 0
    return error_.bundle req, res, 'invalid image path', 400, { filename }

  unless regex_.Sha1.test hash
    return error_.bundle req, res, 'invalid image hash', 400, { filename, hash, extension }

  filepath = "#{storageFolder}/#{container}/#{filename}"

  options =
    headers:
      'Content-Type': 'image/jpeg'

  res.sendFile filepath, options, (err)->
    if err?
      _.error err, "failed to send #{filepath}"
      res.status(err.statusCode).json err
