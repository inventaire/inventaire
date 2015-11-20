__ = require('config').universalPath
_ = __.require 'builders', 'utils'
getItemsImages = __.require 'data', 'inv/get_items_images'
getGoogleImage = __.require 'data', 'google/image'

module.exports = (entityUri, data)->
  # try to find an image on other items first
  # then ask to google books
  getItemsImages entityUri
  .then _.Log('getItemsImages')
  .then requestGoogleImageIfNeeded.bind(null, data)
  .then _.Log('requestGoogleImageIfNeeded')

requestGoogleImageIfNeeded = (data, pictures)->
  if pictures.length > 0 then return pictures
  else if data? then return getGoogleImage data
