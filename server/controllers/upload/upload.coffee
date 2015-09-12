CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
Promise = require 'bluebird'
parseForm = require './lib/parse_form'
error_ = __.require 'lib', 'error/error'
images_ = __.require 'lib', 'images'
{ objectStorage } = CONFIG

client = switch objectStorage
  when 'aws' then require './lib/aws_client'
  when 'swift' then require './lib/swift_client'
  when 'local' then require './lib/local_client'
  else throw new Error 'unknown object storage configuration'

# mimicking what nginx does
if objectStorage is 'local'
  exports.fakeObjectStorage = require './fake_object_storage'

exports.post = (req, res, next)->
  parseForm req
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

exports.putImage = putImage = (fileData)->
  { id, path, type, keepOldFile } = fileData
  # keepOldFile is enabled in ./scripts/upload_jpg
  resizePath = if keepOldFile then "#{path}_resized" else path

  images_.shrink path, resizePath
  .then _.Complete(images_.getHashFilename, null, resizePath)
  .then client.putImage.bind(null, resizePath)
  .then _.Log('new image url')
  .then checkRelativeUrl
  .then (url)-> { id: id, url, url }

checkRelativeUrl = (url)->
  if /http/.test url then throw error_.new 'not a relative url', 500
  return url

indexCollection = (collection)->
  index = {}
  collection.forEach (data)->
    { id, url } = data
    index[id] = url

  return index
