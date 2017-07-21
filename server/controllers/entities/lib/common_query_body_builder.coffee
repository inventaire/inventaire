__ = require('config').universalPath
_ = __.require 'builders', 'utils'

module.exports = (search)->
  should = [
    { match: { _all: search } }
    { prefix: { _all: _.last search.split(' ') } }
  ]

  return { query: { bool: { should } } }
