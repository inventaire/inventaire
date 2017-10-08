__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
getEntityByUri = require './get_entity_by_uri'
items_ = __.require 'controllers', 'items/lib/items'
reverseClaims = require './reverse_claims'
getSerieParts = require './get_serie_parts'
getAuthorWorks = require './get_author_works'
getLinksCount = require './get_links_count'
cache_ = __.require 'lib', 'cache'
{ oneUriSeveralFunctions, severalUrisOneFunction, getUri } = require './popularity_helpers'

module.exports = (uris, refresh)->
  _.type uris, 'array'
  return Promise.props _.indexAppliedValue(uris, getPopularity(refresh))

getPopularity = (refresh)-> (uri)->
  unless _.isEntityUri(uri) then throw new Error 'invalid uri'

  key = "popularity:#{uri}"
  timespan = if refresh then 0 else null
  cache_.get key, getPopularityByUri.bind(null, uri), timespan

getPopularityByUri = (uri)->
  getEntityByUri uri
  .then (entity)->
    { type } = entity
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
  reverseClaims 'wdt:P629', uri
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

