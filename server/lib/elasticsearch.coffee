__ = require('config').universalPath
_ = __.require 'builders', 'utils'

module.exports =
  buildQuery: (search, prefixSearch)->
    should = [ { match: { _all: search } } ]
    if prefixSearch
      # passing only the last word
      should.push { prefix: { _all: search.split(' ').slice(-1)[0] } }

    return _.stringify({ query: { bool: { should: should } } }, 'elasticsearch query')

  parseResponse: (res)-> res.hits.hits.map parseHit

parseHit = (hit)->
  { _source:data, _id } = hit
  data._id = _id
  return data
