CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
searchWikidataEntities = __.require 'data', 'wikidata/search_entities'
searchLocalEntities = require './search_local'
{ search:searchDataseed } = __.require 'data', 'dataseed/dataseed'
{ searchTimeout } = CONFIG
{ enabled:dataseedEnabled } = CONFIG.dataseed
getEntitiesByUris = require './lib/get_entities_by_uris'
promises_ = __.require 'lib', 'promises'

error_ = __.require 'lib', 'error/error'

module.exports = (query, refresh)->
  _.type query, 'object'
  { disableDataseed } = query

  promises = [
    searchWikidataByText query
    searchLocalByText query
  ]

  if dataseedEnabled and not disableDataseed
    promises.push searchDataseedByText(query, refresh)

  promises_.all promises
  .then mergeResults
  .catch _.ErrorRethrow('search by text err')

searchWikidataByText = (query)->
  searchWikidataEntities query
  .timeout searchTimeout
  .map urifyWd
  # Starting to look for the entities as soon as we have a search result
  # as other search results might take more time here but less later
  .then getEntitiesByUris
  .then filterOutIrrelevantTypes
  .catch error_.notFound
  # catching errors to avoid crashing promises_.all

searchLocalByText = (query)->
  searchLocalEntities query
  .timeout searchTimeout
  .map urifyInv
  .then getEntitiesByUris
  .catch error_.notFound

searchDataseedByText = (query, refresh)->
  searchDataseed query, refresh
  .timeout searchTimeout
  .get 'isbns'
  .map urifyIsbn
  .then getEntitiesByUris
  .catch error_.notFound

mergeResults = (results)->
  _(results)
  .compact()
  .map _.property('entities')
  .map _.values
  .flatten()
  .value()

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
