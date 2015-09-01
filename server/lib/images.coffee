CONFIG = require 'config'
__ = CONFIG.root
gm = require 'gm'
Promise = require 'bluebird'
crypto_ = __.require 'lib', 'crypto'
readFile = Promise.promisify require('fs').readFile

module.exports =
  format: (path)->
    formattedPath = "#{path}_formatted"
    new Promise (resolve, reject)->
      gm path
      .noProfile()
      # converting to progressive jpeg
      .interlace('Line')
      # removing EXIF data
      .write formattedPath, ReturnNewPath(formattedPath, resolve, reject)

  getHashFilename: (path, extension='jpg')->
    readFile path
    .then crypto_.sha1
    .then (hash)-> "#{hash}.#{extension}"

  resize: (originalPath, resizedPath, width, height)->
    new Promise (resolve, reject)->
      gm(originalPath)
      .resize(width, height)
      .noProfile()
      .interlace('Line')
      .write resizedPath, ReturnNewPath(resizedPath, resolve, reject)


ReturnNewPath = (newPath, resolve, reject)->
  return cb = (err)->
    if err? then reject err
    else resolve newPath