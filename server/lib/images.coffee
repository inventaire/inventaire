CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
gm = require 'gm'
{ Promise } = __.require 'lib', 'promises'
crypto_ = __.require 'lib', 'crypto'
{ readFile } =  __.require 'lib', 'fs'
{ maxSize, maxWeight } = CONFIG.images
error_ = __.require 'lib', 'error/error'

shrink = (data, width, height)->
  # gm accepts either a path string or a stream
  gm data
  .setFormat 'jpg'
  # only resize if bigger
  .resize width, height, '>'
  # removing EXIF data
  .noProfile()
  # replace the alpha layer by a white background
  .flatten()
  # converting to progressive jpeg
  .interlace 'Line'

module.exports =
  getHashFilename: (path, extension = 'jpg')->
    readFile path
    .then crypto_.sha1
    .then (hash)-> "#{hash}.#{extension}"

  shrink: (originalPath, resizedPath, width = maxSize, height = maxSize)->
    new Promise (resolve, reject)->
      shrink originalPath, width, height
      .write resizedPath, ReturnNewPath(resizedPath, resolve, reject)

  shrinkStream: shrink

  applyLimits: (width, height)->
    return [ applyLimit(width), applyLimit(height) ]

applyLimit = (dimension = maxSize)->
  dimension = Number dimension
  if dimension > maxSize then maxSize
  else dimension

ReturnNewPath = (newPath, resolve, reject)->
  return cb = (err)->
    if err? then reject err
    else resolve newPath
