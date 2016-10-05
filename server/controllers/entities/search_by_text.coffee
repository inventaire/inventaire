CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
searchWikidataEntities = __.require 'data', 'wikidata/entities'
searchLocalEntities = require './search_local'
{ search:searchDataseed } = __.require 'data', 'dataseed/dataseed'
{ searchTimeout } = CONFIG

module.exports = (query)->
  return promises = [
    searchWikidataEntities query
    .timeout searchTimeout
    .then WrapResults('wd', query.search)
    # catching errors to avoid crashing promises_.all
    .catch _.Error('wikidata getBookEntities err')

    searchLocalEntities query
    .timeout searchTimeout
    .then WrapResults('inv', query.search)
    .catch _.Error('searchLocalEntities err')

    searchDataseed query
    .timeout searchTimeout
    .then WrapResults('dataseed', query.search)
    .catch _.Error('searchDataseed err')
  ]

WrapResults = (source, search)-> (results)-> { results, source, search }
