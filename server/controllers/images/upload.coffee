CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
parseForm = require './lib/parse_form'
responses_ = __.require 'lib', 'responses'
error_ = __.require 'lib', 'error/error'
images_ = __.require 'lib', 'images'
{ getImageByUrl } = __.require 'data', 'dataseed/dataseed'
host = CONFIG.fullPublicHost()
containers = require './lib/containers'

module.exports = (req, res, next)->
  { container } = req.query

  unless container? and containers[container]?
    return error_.bundleInvalid req, res, 'container', container

  { putImage } = containers[container]

  parseForm req
  .then (formData)->
    files = getFilesFromFormData formData
    if container is 'users' then files.forEach validateFile
    return files
  .map putImage
  .then indexCollection
  .then _.Log('upload post res')
  .then responses_.Send(res)
  .catch error_.Handler(req, res)

getFilesFromFormData = (formData)->
  { files } = formData

  unless _.isNonEmptyPlainObject files
    throw error_.new 'no file provided', 400, formData

  for key, file of files
    file.id = key

  return _.values files

validateFile = (file)->
  { type } = file
  unless type is 'image/jpeg'
    throw error_.new 'only jpeg are accepted', 400, file

indexCollection = (collection)->
  index = {}
  for data in collection
    { id, url } = data
    index[id] = url
  return index
