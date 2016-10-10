CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
searchWikidataEntities = __.require 'data', 'wikidata/search_entities'
searchLocalEntities = require './search_local'
{ search:searchDataseed } = __.require 'data', 'dataseed/dataseed'
{ searchTimeout } = CONFIG
getEntitiesByUris = require './lib/get_entities_by_uris'
promises_ = __.require 'lib', 'promises'

module.exports = (query)->
  promises_.all [
    searchWikidataEntities query
    .timeout searchTimeout
    .map urifyWd
    # Starting to look for the entities as soon as we have a search result
    # as other search results might take more time here but less later
    .then getEntitiesByUris
    # catching errors to avoid crashing promises_.all
    .catch _.Error('wikidata getBookEntities err')

    searchLocalEntities query
    .timeout searchTimeout
    .map urifyInv
    .then getEntitiesByUris
    .catch _.Error('searchLocalEntities err')

    searchDataseed query
    .timeout searchTimeout
    .get 'isbns'
    .map urifyIsbn
    .then getEntitiesByUris
    .catch _.Error('searchDataseed err')
  ]
  .then mergeResults
  .catch _.ErrorRethrow('search by text err')

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
