CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
{ buildQuery, parseResponse } = __.require 'lib', 'elasticsearch'

searchEndpoint = CONFIG.elasticsearch.host + '/entity/_search'

module.exports = (query)->
  _.type query.search, 'string'
  promises_.post
    url: searchEndpoint
    body: buildQuery(query.search, true)
  .then parseResponse
