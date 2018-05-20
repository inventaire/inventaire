__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
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

findAnImage = (entity)->
  commonsFilename = getCommonsFilenamesFromClaims(entity.claims)[0]
  enwikiTitle = entity.sitelinks.enwiki
  openLibraryId = entity.claims['wdt:P648']?[0]
  return pickBestPic entity, commonsFilename, enwikiTitle, openLibraryId

pickBestPic = (entity, commonsFilename, enwikiTitle, openLibraryId)->
  Promise.props
    wm: timeoutAndPreventThrow getThumbData(commonsFilename)
    wp: timeoutAndPreventThrow getEnwikiImage(enwikiTitle)
    ol: timeoutAndPreventThrow getOpenLibraryCover(openLibraryId, entity.type)
  .then (results)->
    order = getPicSourceOrder entity
    orderedResults = _.pick results, order
    bestPicData = _.compact(_.values(orderedResults))[0]
    return bestPicData or getAvatarsDataFromClaims(entity.claims)[0]

timeoutAndPreventThrow = (promise)->
  promise
  .timeout 5000
  .catch (err)-> return

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
