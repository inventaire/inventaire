__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
cache_ = __.require 'lib', 'cache'
{ oneUriSeveralFunctions, severalUrisOneFunction, getUri } = require './popularity_helpers'

getSerieParts = require './get_serie_parts'
getAuthorWorks = require './get_author_works'
getLinksCount = require './get_links_count'

# Working around circular dependencies
items_ = null
getEntityByUri = null
reverseClaims = null
getEntitiesPopularity = null
lateRequire = ->
  items_ = __.require 'controllers', 'items/lib/items'
  getEntityByUri = require './get_entity_by_uri'
  reverseClaims = require './reverse_claims'
  getEntitiesPopularity = require './get_entities_popularity'

setTimeout lateRequire, 0

module.exports = (uri)->
  getEntityByUri uri
  .then (entity)->
    { type } = entity
    unless type?
      _.warn uri, "can't get popularity of entities without known type"
      return 0

    getter = popularityGettersByType[type]
    unless getter?
      _.warn type, 'no popularity getter for this type'
      return 0

    return getter uri

getItemsCount = (uri)->
  items_.byEntity uri
  .map _.property('owner')
  # Count the owners so that no more than one item per user is counted
  .then (owners)-> _.uniq(owners).length

getWorkEditionsScores = (uri)->
  reverseClaims { property: 'wdt:P629', value: uri }
  .map getItemsCount
  .then _.sum

getPartsScores = (uri)->
  getSerieParts uri
  .then (res)->
    uris = res.parts.map getUri
    return getWorksPopularity uris

getAuthorWorksScores = (uri)->
  getAuthorWorks uri
  .then (res)->
    Promise.all [
      # Only getting their links scores and not their full popularity score
      # as it would count works in those series twice
      getSeriesLinksCounts res.series.map(getUri)
      getWorksPopularity res.works.map(getUri)
    ]
    .then _.sum

popularityGettersByType =
  edition: getItemsCount
  work: oneUriSeveralFunctions getItemsCount, getWorkEditionsScores
  serie: oneUriSeveralFunctions getPartsScores
  human: oneUriSeveralFunctions getAuthorWorksScores

getSeriesLinksCounts = severalUrisOneFunction getLinksCount

# Using getEntitiesPopularity instead of the more specific
# popularityGettersByType.work to use cached value if available
getCachedPopularity = (uri)->
  getEntitiesPopularity [ uri ], false
  .get uri

getWorksPopularity = severalUrisOneFunction getCachedPopularity
