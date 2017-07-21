CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ buildSearcher } = __.require 'lib', 'elasticsearch'

queryBodyBuilder = (search)->
  should = [
    { match: { _all: search } }
    { prefix: { _all: _.last search.split(' ') } }
  ]

  return { query: { bool: { should } } }

module.exports =
  wikidata: buildSearcher
    index: 'wikidata'
    queryBodyBuilder: queryBodyBuilder
  inventaire: buildSearcher
    dbBaseName: 'entities'
    queryBodyBuilder: queryBodyBuilder
