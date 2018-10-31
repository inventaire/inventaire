CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
gm = require 'gm'
{ Promise } = __.require 'lib', 'promises'
crypto_ = __.require 'lib', 'crypto'
{ readFile } =  __.require 'lib', 'fs'
{ maxSize, maxWeight } = CONFIG.mediaStorage.images
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

removeExif = (data)->
  gm data
  .noProfile()

getUrlFromImageHash = (container)-> (filename)->
  if filename? then "/img/#{container}/#{filename}"

module.exports =
  getHashFilename: (path, extension)->
    readFile path
    .then crypto_.sha1
    .then (hash)->
      if extension then "#{hash}.#{extension}"
      else hash

  shrink: (path, width = maxSize, height = maxSize)->
    return new Promise (resolve, reject)->
      shrink path, width, height
      .write path, returnPath(path, resolve, reject)

  shrinkStream: shrink

  removeExif: (path)->
    return new Promise (resolve, reject)->
      removeExif path
      .write path, returnPath(path, resolve, reject)

  applyLimits: (width, height)->
    return [ applyLimit(width), applyLimit(height) ]

  getUrlFromEntityImageHash: getUrlFromImageHash 'entities'

applyLimit = (dimension = maxSize)->
  dimension = Number dimension
  if dimension > maxSize then maxSize
  else dimension

returnPath = (newPath, resolve, reject)-> (err)->
  if err? then reject err
  else resolve newPath
