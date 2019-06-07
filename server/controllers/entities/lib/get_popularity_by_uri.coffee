__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
cache_ = __.require 'lib', 'cache'

getSerieParts = require './get_serie_parts'
getAuthorWorks = require './get_author_works'

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
  getEntityByUri { uri, dry: true }
  .then (entity)->
    # Case where the entity wasn't available in cache
    unless entity? then return 0

    { type } = entity
    unless type?
      _.warn uri, "can't get popularity of entities without known type"
      return 0

    getter = popularityGettersByType[type]
    unless getter?
      _.warn type, 'no popularity getter for this type'
      return 0

    return getter uri
  .then addBonusPoints(uri)

getItemsCount = (uri)->
  items_.byEntity uri
  .map _.property('owner')
  # Count the owners so that no more than one item per user is counted
  .then (owners)-> _.uniq(owners).length

getEditionsScores = (property)-> (uri)->
  # Limit request to local entities as Wikidata editions entities are currently ignored
  # see https://github.com/inventaire/inventaire/issues/182
  reverseClaims { property, value: uri, dry: true }
  .then (editonsUris)->
    editonsCount = editonsUris.length
    Promise.all editonsUris.map(getItemsCount)
    .then (editionsItemsCounts)-> _.sum(editionsItemsCounts) + editonsCount

getWorkEditionsScores = getEditionsScores 'wdt:P629'
getPublisherScore = getEditionsScores 'wdt:P123'

getPartsScores = (uri)->
  getSerieParts { uri, dry: true }
  .then (res)->
    partsUris = res.parts.map getUri
    return getEntitiesPopularityTotal partsUris

getAuthorWorksScores = (uri)->
  getAuthorWorks { uri, dry: true }
  .then (res)->
    worksUris = res.works.map getUri
    seriesCount = res.series.length
    articlesCount = res.articles.length
    return getEntitiesPopularityTotal worksUris
    .then (worksScore)-> worksScore + seriesCount + articlesCount

getUri = _.property 'uri'

getEntitiesPopularityTotal = (uris)->
  getEntitiesPopularity uris, true
  .then _.values
  # Total = sum of all popularities + number of subentities
  .then (results)-> _.sum(results) + results.length

popularityGettersByType =
  edition: getItemsCount
  work: getWorkEditionsScores
  serie: getPartsScores
  human: getAuthorWorksScores
  publisher: getPublisherScore

# Wikidata entities get a bonus as being on Wikidata is already kind of a proof of a certain
# level of popularity
addBonusPoints = (uri)-> (score)->
  if _.isWdEntityUri uri then score + 5
  else score
