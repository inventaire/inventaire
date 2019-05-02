CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
requests_ = __.require 'lib', 'requests'
qs = require 'querystring'

module.exports = (endpoint, query)->
  escapedQuery = qs.escape query
  base = "#{endpoint}?query="
  headers = { accept: 'application/sparql-results+json' }
  url = base + escapedQuery

  requests_.get { url, headers }
  .then (res)->
    res.results.bindings
    .map (result)->
      quotation: result.title?.value
      url: result.work?.value
