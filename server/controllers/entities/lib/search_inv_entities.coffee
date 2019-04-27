CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ buildSearcher } = __.require 'lib', 'elasticsearch'

module.exports = buildSearcher
  dbBaseName: 'entities'
  queryBodyBuilder: (search, limit = 20)->
    should = [
      { match: { _all: search } }
      { prefix: { _all: _.last search.split(' ') } }
    ]

    return { size: limit, query: { bool: { should } } }
