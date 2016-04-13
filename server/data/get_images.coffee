CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
books_ = __.require 'lib','books'

getItemsImages = __.require 'data', 'inv/get_items_images'
getGoogleImage = __.require 'data', 'google/image'
getAbebooksImage = __.require 'data', 'abebooks/image'
restrictedAccess = __.require 'data', 'restricted_access'

module.exports = (entityUri, data, ip)->
  # try to find an image on other items first
  # then ask to google books
  getItemsImages entityUri
  .then findImage.bind(null, entityUri, data, ip)
  .catch format404

findImage = (entityUri, data, ip, pictures)->
  if pictures.length > 0 then return pictures

  tryAbebooks entityUri, data
  .catch (err)->
    if data? then requestGoogleImage data, ip
    else throw err

tryAbebooks = (entityUri, data)->
  [ prefix, id ] = entityUri.split ':'
  if prefix is 'isbn' then return getAbebooksImage id

  # data could be an isbn in the case of a wikidata entity uri
  dataIsIsbn = books_.isIsbn data
  if dataIsIsbn then return getAbebooksImage data

  return promises_.reject error_.new('no isbn provided', 404, entityUri)

requestGoogleImage = (data, ip)->
  # Prevent restricted ips to eat too much of
  # the Google Books quota
  # This restriction is applied specifially to images
  # as the biggest consumer of GB API calls are prerender queries
  # tons of low traffic wikidata entities
  if restrictedAccess ip then return
  else return getGoogleImage data

format404 = (err)->
  # avoid returning error message specific to a given provider
  if err.status is 404 then err.message = 'Not Found'
  throw err
