__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
entities_ = require './entities'
runWdQuery = __.require 'data', 'wikidata/run_query'
{ prefixifyWd } = __.require 'controllers', 'entities/lib/prefix'
{ getSimpleDayDate, sortByScore } = require './queries_utils'
{ types, typesNames, getTypePluralNameByTypeUri } = __.require 'lib', 'wikidata/aliases'

# Working around the circular dependency
getEntitiesPopularity = null
lateRequire = -> getEntitiesPopularity = require './get_entities_popularity'
setTimeout lateRequire, 0

whitelistedTypesNames = [ 'series', 'works', 'articles' ]

module.exports = (uri, refresh)->
  _.types arguments, ['string', 'boolean|undefined'], 1
  [ prefix, id ] = uri.split ':'
  promises = []

  worksByTypes = _.initCollectionsIndex whitelistedTypesNames

  # If the prefix is 'inv' or 'isbn', no need to check Wikidata
  if prefix is 'wd'
    promises.push getWdAuthorWorks(id, worksByTypes, refresh)

  promises.push getInvAuthorWorks(uri, worksByTypes)

  promises_.all promises
  .then _.flatten
  .then (results)->
    getPopularityScores results
    .then spreadByType(worksByTypes, results)
  .catch _.ErrorRethrow('get author works err')

## WD
getWdAuthorWorks = (qid, worksByTypes, refresh)->
  runWdQuery { query: 'author-works', qid, refresh }
  .map formatWdEntity
  .filter _.identity
  .then (results)->
    # Known case of duplicate: when an entity has two P31 values that both
    # resolve to the same whitelisted type
    # ex: Q23701761 → P31 → Q571/Q17518461
    # Deduplicate after formatting so that if an entity as one valid P31
    # and an invalid one, it still gets one
    uris = []
    return results.filter deduplicate(uris)

deduplicate = (uris)-> (result)->
  { uri } = result
  if uri in uris
    _.warn uri, "duplicated id: #{uri}"
    return false
  else
    uris.push uri
    return true

formatWdEntity = (result)->
  { work:wdId, type:typeWdId, date, serie } = result
  typeUri = "wd:#{typeWdId}"
  typeName = getTypePluralNameByTypeUri typeUri

  if typeName not in whitelistedTypesNames then return

  date = getSimpleDayDate date
  serie = prefixifyWd serie
  return { type: typeName, uri: "wd:#{wdId}", date, serie }

## INV
getInvAuthorWorks = (uri, worksByTypes)->
  entities_.byClaim 'wdt:P50', uri, true
  .get 'rows'
  .map formatInvEntity
  .filter _.identity

formatInvEntity = (row)->
  typeUri = row.value
  typeName = getTypePluralNameByTypeUri typeUri
  if typeName not in whitelistedTypesNames then return
  return {
    uri: "inv:#{row.id}"
    date: row.doc.claims['wdt:P577']?[0]
    serie: row.doc.claims['wdt:P179']?[0]
    type: typeName
  }

## COMMONS
getPopularityScores = (results)->
  uris = _.map results, 'uri'
  return getEntitiesPopularity uris

spreadByType = (worksByTypes, rows)-> (scores)->
  for row in rows
    { type } = row
    delete row.type
    row.score = scores[row.uri]
    worksByTypes[type].push row

  return sortTypesByScore worksByTypes

# TODO: prevent a work with several wdt:P577 values to appear several times
# ex: https://inventaire.io/api/entities?action=serie-parts&uri=wd:Q8337
sortTypesByScore = (worksByTypes)->
  for name, results of worksByTypes
    worksByTypes[name] = results.sort sortByScore
  return worksByTypes
