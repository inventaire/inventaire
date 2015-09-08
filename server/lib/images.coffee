CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
gm = require 'gm'
Promise = require 'bluebird'
crypto_ = __.require 'lib', 'crypto'
fs_ =  __.require 'lib', 'fs'
{ maxSize, maxWeight } = CONFIG.images
fastimage = require 'fastimage'
error_ = __.require 'lib', 'error/error'


module.exports =
  format: (path)->
    formattedPath = "#{path}_formatted"
    new Promise (resolve, reject)->
      gm path
      .noProfile()
      # converting to progressive jpeg
      .interlace 'Line'
      # removing EXIF data
      .write formattedPath, ReturnNewPath(formattedPath, resolve, reject)

  getHashFilename: (path, extension='jpg')->
    fs_.readFile path
    .then crypto_.sha1
    .then (hash)-> "#{hash}.#{extension}"

  shrink: (originalPath, resizedPath, width, height)->
    new Promise (resolve, reject)->
      gm originalPath
      # only resize if bigger
      .resize width, height, '>'
      .noProfile()
      .interlace 'Line'
      .write resizedPath, ReturnNewPath(resizedPath, resolve, reject)

  applyLimits: (width, height)->
    return [ applyLimit(width), applyLimit(height) ]

applyLimit = (dimension=maxSize)->
  dimension = Number dimension
  if dimension > maxSize then maxSize
  else dimension

ReturnNewPath = (newPath, resolve, reject)->
  return cb = (err)->
    if err? then reject err
    else resolve newPath
