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
lateRequire = ->
  items_ = __.require 'controllers', 'items/lib/items'
  getEntityByUri = require './get_entity_by_uri'
  reverseClaims = require './reverse_claims'

setTimeout lateRequire, 0

module.exports = (uris, fast=true, refresh)->
  _.type uris, 'array'
  if uris.length is 0 then return promises_.resolve {}
  # Using fastGet to work around the slow popularity calculation
  # especially for Wikidata entities, which rely on remote SPARQL queries
  # which are limited to 5 concurrent requests
  # The classic cache get is used principally for testing purposes
  fnName = if fast then 'fastGet' else 'get'
  urisPopularity = _.indexAppliedValue uris, getPopularity(fnName, refresh)
  return promises_.props urisPopularity

getPopularity = (fnName, refresh)-> (uri)->
  unless _.isEntityUri(uri) then throw error_.new 'invalid uri', 400, uri

  key = "popularity:#{uri}"
  timespan = if refresh then 0 else null
  fn = getPopularityByUri.bind null, uri

  cache_[fnName](key, fn, timespan)
  .then defaultToZero

# Returning 0 if the cache is currently empty, which is kind of rational:
# if the cache is empty, the entity isn't that popular
defaultToZero = (value)-> value or 0

getPopularityByUri = (uri)->
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
# Using getPopularityByUri instead of the more specific
# popularityGettersByType.work to use cached value if available
getWorksPopularity = severalUrisOneFunction getPopularityByUri
