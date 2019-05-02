CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
requests_ = __.require 'lib', 'requests'
qs = require 'querystring'
cache_ = __.require 'lib', 'cache'
{ oneMonth } =  __.require 'lib', 'times'

endpoint = 'https://jpsearch.go.jp/rdf/sparql'
base = "#{endpoint}?query="
headers = { accept: 'application/sparql-results+json' }

module.exports = (ndlId)->
  key = "ndl:author-works-titles:#{ndlId}"
  return cache_.get { key, fn: getNdlAuthorWorksTitles.bind(null, ndlId), timespan: 3*oneMonth }

getNdlAuthorWorksTitles = (ndlId)->
  _.info ndlId, 'ndlId'
  url = base + getQuery(ndlId)
  requests_.get { url, headers }
  .then (res)->
    res.results.bindings
    .map (result)->
      quotation: result.title?.value
      url: result.work?.value

getQuery = (ndlId)->
  query = """
  SELECT * WHERE {
    ?work <http://schema.org/creator> <http://id.ndl.go.jp/auth/entity/#{ndlId}> .
    ?work <http://schema.org/name> ?title .
  }
  """
  return qs.escape query
