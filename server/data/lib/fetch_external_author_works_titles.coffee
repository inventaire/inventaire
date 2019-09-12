CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
requests_ = __.require 'lib', 'requests'
qs = require 'querystring'
cache_ = __.require 'lib', 'cache'
{ oneMonth } =  __.require 'lib', 'times'
timespan = 3 * oneMonth

module.exports = (name, endpoint, getQuery)-> (id)->
  key = "#{name}:author-works-titles:#{id}"
  return cache_.get { key, fn: fetch.bind(null, endpoint, getQuery(id), id), timespan }
  .timeout 20000
  .catch (err)->
    _.error err, "#{name} error fetching #{id}"
    return []

fetch = (endpoint, query)->
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
