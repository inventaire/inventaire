CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
getItemsImages = __.require 'data', 'inv/get_items_images'
getGoogleImage = __.require 'data', 'google/image'
restrictedAccess = __.require 'data', 'restricted_access'

module.exports = (entityUri, data, ip)->
  # try to find an image on other items first
  # then ask to google books
  getItemsImages entityUri
  .then requestGoogleImageIfNeeded.bind(null, data, ip)

requestGoogleImageIfNeeded = (data, ip, pictures)->
  if pictures.length > 0 then return pictures
  else if data?
    # Prevent restricted ips to eat too much of
    # the Google Books quota
    # This restriction is applied specifially to images
    # as the biggest consumer of GB API calls are prerender queries
    # tons of low traffic wikidata entities
    if restrictedAccess ip then return
    else return getGoogleImage data
