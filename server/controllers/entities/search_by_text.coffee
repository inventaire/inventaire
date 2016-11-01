CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
searchWikidataEntities = __.require 'data', 'wikidata/search_entities'
searchLocalEntities = require './search_local'
{ search:searchDataseed } = __.require 'data', 'dataseed/dataseed'
{ searchTimeout } = CONFIG
{ enabled:dataseedEnabled } = CONFIG.dataseed
getEntitiesByUris = require './lib/get_entities_by_uris'
GetEntitiesByUris = (refresh)-> (uris)-> getEntitiesByUris uris, refresh
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'

module.exports = (query)->
  _.type query, 'object'
  { disableDataseed, refresh } = query

  promises = [
    searchWikidataByText query
    searchLocalByText query
  ]

  if dataseedEnabled and not disableDataseed
    promises.push searchDataseedByText(query)

  promises_.all promises
  .then mergeResults
  .then ReplaceEditionsByTheirWork(refresh)
  .then _.values
  .catch _.ErrorRethrow('search by text err')

searchWikidataByText = (query)->
  searchWikidataEntities query
  .timeout searchTimeout
  .map urifyWd
  # Starting to look for the entities as soon as we have a search result
  # as other search results might take more time here but less later
  .then GetEntitiesByUris(query.refresh)
  .then filterOutIrrelevantTypes
  .catch error_.notFound

searchLocalByText = (query)->
  searchLocalEntities query
  .timeout searchTimeout
  .map urifyInv
  .then GetEntitiesByUris(query.refresh)
  .catch error_.notFound

searchDataseedByText = (query)->
  { search, refresh } = query
  searchDataseed search, refresh
  .timeout searchTimeout
  .get 'isbns'
  .map urifyIsbn
  .then GetEntitiesByUris(refresh)
  .catch error_.notFound

urifyWd = (wdId)-> "wd:#{wdId}"
urifyIsbn = (isbn)-> "isbn:#{isbn}"
# It's ok to use the inv URI even if its not the canonical URI
# (wd and isbn URI are prefered) as getEntitiesByUris will
# take care of finding the right URI downward
urifyInv = (entity)-> "inv:#{entity._id}"

filterOutIrrelevantTypes = (result)->
  for uri, entity of result.entities
    { type } = entity
    if not type or type is 'meta'
      _.warn entity, 'filtered out'
      delete result.entities[uri]

  return result

mergeResults = (results)->
  _.flattenIndexes _.compact(results).map(_.property('entities'))

ReplaceEditionsByTheirWork = (refresh)-> (entities)->
  missingWorkEntities = []
  for uri, entity of entities
    if entity.type is 'edition'
      workUri = entity.claims['wdt:P629'][0]
      # Ensure that the edition work is in the results
      unless entities[workUri]? then missingWorkEntities.push workUri
      # Remove the edition from the results as it will be fetched later
      # as an edition of its work
      delete entities[uri]

  missingWorkEntities = _.uniq missingWorkEntities
  _.log missingWorkEntities, 'missingWorkEntities from editions'

  return getEntitiesByUris missingWorkEntities, refresh
  .then (results)-> _.extend entities, results.entities
