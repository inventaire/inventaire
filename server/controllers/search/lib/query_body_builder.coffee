CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

module.exports = (search)->
  should = [
    { match: { _all: { query: search, boost: 5 } } }
    { prefix: { _all: _.last(search.split(' ')) } }
  ]

  return { query: { bool: { should } } }
