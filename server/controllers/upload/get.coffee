CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
Promise = require 'bluebird'
parseForm = require './lib/parse_form'
error_ = __.require 'lib', 'error/error'
images_ = __.require 'lib', 'images'
fs_ =  __.require 'lib', 'fs'
maxSize = 1024
base = __.path 'client', 'public/uploads'
regex_ = __.require 'models', 'tests/regex'
urlBase = CONFIG.images.urlBase()

# resized images urls looks like /img/#{hash}.#{extension}?width=#{width}&height=#{height}"
# expect the files to be in public/img/

module.exports = (req, res, next)->
  { width, height } = req.query
  filename = getFilename req
  [ hash, extension, others... ] = filename.split '.'

  if others.length > 0
    return error_.bundle res, 'invalid image path', 400

  unless regex_.Sha1.test hash
    return error_.bundle res, 'invalid image hash', 400

  unless extension is 'jpg'
    return error_.bundle res, 'accepts jpg extension only', 400

  [ width, height ] = images_.applyLimits width, height

  originalPath = getOriginalPath filename
  resizedPath = getResizedPath filename, width, height

  fs_.exist resizedPath
  .catch getResizedFile.bind(null, originalPath, resizedPath, width, height)
  .then _.Complete(res.sendFile, res, resizedPath)
  .catch formatErrNoEnt
  .catch error_.Handler(res)

getFilename = (req)->
  { pathname } = req._parsedUrl
  filename = pathname.replace urlBase, ''

getResizedFile = (originalPath, resizedPath, width, height, err)->
  unless err.code is 'ENOENT' then throw err
  _.info resizedPath, 'creating resized version (object storage local mode)'
  fs_.exist originalPath
  .then images_.shrink.bind(null, originalPath, resizedPath, width, height)

getOriginalPath = (filename)-> "#{base}/#{filename}"
getResizedPath = (filename, width, height)->
  [ hash, extension ] = filename.split '.'
  "#{base}/#{hash}-#{width}-#{height}.#{extension}"

formatErrNoEnt = (err)->
  if err.code is 'ENOENT' then throw error_.new 'Not found', 404, err
  else throw err
