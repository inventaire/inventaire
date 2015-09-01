CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
Promise = require 'bluebird'
parseForm = require './lib/parse_form'
error_ = __.require 'lib', 'error/error'
images_ = __.require 'lib', 'images'
{ objectStorage } = CONFIG

client = switch objectStorage
  when 'aws' then require './lib/knox-client'
  when 'local' then require './lib/local-client'
  else throw new Error 'CONFIG.objectStorage should be set'

if objectStorage is 'local'
  exports.get = require './get'


exports.post = (req, res, next)->
  parseForm req
  .then _.Success('form parse')
  .then (formData)->
    { fields, files } = formData
    for key, file of files
      validateFile file
      file.id = key

    promises = _.values(files).map putImage

    Promise.all promises
    .then indexCollection

  .then res.json.bind(res)
  .catch error_.Handler(res)

validateFile = (file)->
  { type } = file
  unless type is 'image/jpeg'
    throw error_.new 'only jpeg are accepted', 400, type, file

putImage = (file)->
  # /tmp/path
  { id, path, type } = file

  images_.format path
  .then _.Log('formatted img path')
  .then (path)->
    images_.getHashFilename path
    .then client.putImage.bind(null, path)
  .then _.Log('url')
  .then (url)-> { id: id, url, url }

indexCollection = (collection)->
  index = {}
  collection.forEach (data)->
    { id, url } = data
    index[id] = url

  return index

exports.del = (req, res, next)->
  { urls } = req.body
  _.log urls, 'urls to delete'
  client.deleteImages urls
  .then (resp)->
    if resp.statusCode is 200 then return
    else throw error_.new 'failed deleting image', 500, resp
  .then _.Ok(res)
  .catch error_.Handler(res)
