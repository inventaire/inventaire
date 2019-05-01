CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
requests_ = __.require 'lib', 'requests'
qs = require 'querystring'
cache_ = __.require 'lib', 'cache'
{ oneMonth } =  __.require 'lib', 'times'

endpoint = 'http://datos.bne.es/sparql'
base = "#{endpoint}?query="
headers = { accept: 'application/sparql-results+json' }

module.exports = (bneId)->
  key = "bne:author-works-titles:#{bneId}"

  return cache_.get { key, fn: getBneAuthorWorksTitles.bind(null, bneId), timespan: 3*oneMonth }

getBneAuthorWorksTitles = (bneId)->
  _.info bneId, 'bneId'
  url = base + getQuery(bneId)
  requests_.get { url, headers }
  .then (res)->
    res.results.bindings
    .map (result)->
      {quotation: result.title?.value
      url: result.value?.value}

getQuery = (bneId)->
  query = """
  SELECT ?value ?title WHERE {
    <http://datos.bne.es/resource/#{bneId}> <http://datos.bne.es/def/OP5001> ?value .
    ?value <http://datos.bne.es/def/P1001> ?title
  }
  """
  return qs.escape query
