__ = require('config').universalPath
_ = __.require 'builders', 'utils'

module.exports = (search, limit = 20)->
  should = [
    { match: { _all: search } }
    { prefix: { _all: _.last search.split(' ') } }
  ]

  return { size: limit, query: { bool: { should } } }
