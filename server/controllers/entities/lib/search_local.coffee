CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ buildSearcher } = __.require 'lib', 'elasticsearch'

module.exports = buildSearcher
  dbBaseName: 'entities'
  queryBodyBuilder: (search)->
    should = [
      { match: { _all: search } }
      { prefix: { _all: _.last search.split(' ') } }
    ]

    return { query: { bool: { should } } }
