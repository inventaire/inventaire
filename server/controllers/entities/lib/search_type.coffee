CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ buildSearcher } = __.require 'lib', 'elasticsearch'

invEntitiesIndex = CONFIG.db.name 'entities'
index = "wikidata,#{invEntitiesIndex}"

module.exports = buildSearcher
  index: index
  queryBodyBuilder: (search)->
    should = [
      { match: { _all: search } }
      { prefix: { _all: _.last search.split(' ') } }
    ]

    return { query: { bool: { should } } }
