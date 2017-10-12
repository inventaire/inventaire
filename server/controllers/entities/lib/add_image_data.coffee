__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
getThumbData = __.require 'data', 'commons/thumb'
getEnwikiImage = __.require 'data', 'wikipedia/image'
getOpenLibraryCover = __.require 'data', 'openlibrary/cover'
{ getAvatarsDataFromClaims } = require './get_avatars_from_claims'
getCommonsFilenamesFromClaims = require './get_commons_filenames_from_claims'

module.exports = (entity)->
  findAnImage entity
  .then (data)->
    entity.image = data
    return entity
  .catch (err)->
    if err.statusCode is 404
      entity.image = getAvatarsDataFromClaims(entity.claims)[0]
    else
      _.error err, 'addImageData err'
    return entity

findAnImage = (entity)->
  commonsFilename = getCommonsFilenamesFromClaims(entity.claims)[0]
  enwikiTitle = entity.sitelinks.enwiki
  openLibraryId = entity.claims['wdt:P648']?[0]
  return pickBestPic entity, commonsFilename, enwikiTitle, openLibraryId

pickBestPic = (entity, commonsFilename, enwikiTitle, openLibraryId)->
  getters = {}
  if commonsFilename? then getters.wm = getThumbData.bind null, commonsFilename
  if enwikiTitle? then getters.wp = getEnwikiImage.bind null, enwikiTitle
  if openLibraryId?
    getters.ol = getOpenLibraryCover.bind null, openLibraryId, entity.type

  order = getPicSourceOrder entity
  candidates = _.values _.pick(getters, order)
  if candidates.length is 0 then return promises_.resolved

  return promises_.fallbackChain candidates, 5000

getPicSourceOrder = (entity)->
  { type } = entity
  switch type
    # Commons pictures are prefered to Wikipedia and Open Library
    # to get access to photo credits
    when 'human' then return ['wm', 'wp', 'ol']
    when 'work'
      # Giving priority to openlibrary's pictures for works
      # as it has only covers while commons sometimes has just an illustration
      # Give priority to Wikimedia over Wikipedia for works
      # likely to be in the public domain and have a good image set in Wikidata
      # while querying images from English Wikipedia articles
      # can give quite random results
      publicationYear = entity.claims['wdt:P577']?[0]?.split('-')[0]
      if publicationYear? and parseInt(publicationYear) < yearsAgo(70)
        return ['ol', 'wm', 'wp']
      else
        return ['ol', 'wp', 'wm']

    else
      return ['wm', 'wp']

yearsAgo = (years)-> new Date().getYear() + 1900 - years
