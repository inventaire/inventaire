CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

module.exports = (search, size)->
  should = [
    { match_phrase_prefix: { _all: { query: search, boost: 5 } } }
    { match: { _all: { query: search, boost: 5 } } }
    { prefix: { _all: _.last(search.split(' ')) } }
  ]

  return { query: { bool: { should } }, size, min_score: 0.5 }
