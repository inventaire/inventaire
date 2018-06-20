CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
parseForm = require './lib/parse_form'
responses_ = __.require 'lib', 'responses'
error_ = __.require 'lib', 'error/error'
images_ = __.require 'lib', 'images'
{ putImage } = require './put_image'
{ getImageByUrl } = __.require 'data', 'dataseed/dataseed'
{ enabled:dataseedEnabled } = CONFIG.dataseed
host = CONFIG.fullPublicHost()

module.exports = (req, res, next)->
  # Set ipfs=true to get a IPFS hash instead of a local URL
  ipfs = dataseedEnabled and _.parseBooleanString(req.query.ipfs)

  parseForm req
  .then (formData)->
    { fields, files } = formData

    unless _.isNonEmptyPlainObject files
      throw error_.new 'no file provided', 400, formData

    for key, file of files
      validateFile file
      file.id = key

    return Promise.all _.values(files).map(putImage)
  .map convertUrl(ipfs)
  .then indexCollection
  .then _.Log('upload post res')
  .then responses_.Send(res)
  .catch error_.Handler(req, res)

convertUrl = (ipfs)-> (urlData)->
  unless ipfs then return urlData

  getImageByUrl "#{host}#{urlData.url}"
  .get 'url'
  .then (ipfsPath)->
    urlData.url = ipfsPath
    return urlData

validateFile = (file)->
  { type } = file
  unless type is 'image/jpeg'
    throw error_.new 'only jpeg are accepted', 400, type, file

indexCollection = (collection)->
  index = {}
  for data in collection
    { id, url } = data
    index[id] = url

  return index
