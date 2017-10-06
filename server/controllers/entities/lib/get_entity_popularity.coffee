__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
getEntityByUri = require './get_entity_by_uri'
items_ = __.require 'controllers', 'items/lib/items'
reverseClaims = require './reverse_claims'
getSerieParts = require './get_serie_parts'
getAuthorWorks = require './get_author_works'
getLinksCount = require './get_links_count'
{ oneUriSeveralFunctions, severalUrisOneFunction, getUri } = require './popularity_helpers'

module.exports = (uri, refresh)->
  # check cache
  getPopularityByUri uri

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
    .then _.Log('BLA')
    .then _.sum

popularityGettersByType =
  edition: getItemsCount
  work: oneUriSeveralFunctions getItemsCount, getWorkEditionsScores
  serie: oneUriSeveralFunctions getPartsScores
  human: oneUriSeveralFunctions getAuthorWorksScores

getSeriesLinksCounts = severalUrisOneFunction getLinksCount
getWorksPopularity = severalUrisOneFunction popularityGettersByType.work

