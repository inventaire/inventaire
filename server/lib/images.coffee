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

  shrink: (originalPath, resizedPath, width=maxSize, height=maxSize)->
    new Promise (resolve, reject)->
      gm originalPath
      .setFormat 'jpg'
      # only resize if bigger
      .resize width, height, '>'
      .noProfile()
      .interlace 'Line'
      .write resizedPath, ReturnNewPath(resizedPath, resolve, reject)

  shrinkStream: (stream, width, height)->
    gm stream
    .setFormat 'jpg'
    .resize width, height, '>'
    .noProfile()
    .interlace 'Line'

  applyLimits: (width, height)->
    return [ applyLimit(width), applyLimit(height) ]

  check: (url)->
    fastimage.info url
    .then checkImageSize
    .catch formatCheckErr.bind(null, url)

checkImageSize = (data)->
  { size } = data
  if size > maxWeight
    throw error_.new 'image is too big', 400

formatCheckErr = (url, err)->
  _.log  err, 'image check err'
  throw error_.complete err, err.httpCode or 500, url

applyLimit = (dimension=maxSize)->
  dimension = Number dimension
  if dimension > maxSize then maxSize
  else dimension

ReturnNewPath = (newPath, resolve, reject)->
  return cb = (err)->
    if err? then reject err
    else resolve newPath
