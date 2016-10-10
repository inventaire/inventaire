CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'

searchEndpoint = CONFIG.elasticsearch.base + '/entity/_search'

module.exports = (query)->
  promises_.post
    url: searchEndpoint
    body: _.stringify buildQuery(query.search), 'query'
  .then _.property('hits.hits')
  .map parseHit

buildQuery = (query)->
  query:
    bool:
      should: [
        { match: { _all: query } }
        # passing only the last word
        { prefix: { _all: query.split(' ').slice(-1)[0] } }
      ]

parseHit = (hit)->
  { _source:data, _id } = hit
  data._id = _id
  return data
