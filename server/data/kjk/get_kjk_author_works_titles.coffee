CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
requests_ = __.require 'lib', 'requests'
qs = require 'querystring'
cache_ = __.require 'lib', 'cache'
{ oneMonth } =  __.require 'lib', 'times'

endpoint = 'http://data.bibliotheken.nl/sparql'
base = "#{endpoint}?query="
headers = { accept: 'application/sparql-results+json' }

module.exports = (kjkId)->
  key = "kjk:author-works-titles:#{kjkId}"

  return cache_.get { key, fn: getKjkAuthorWorksTitles.bind(null, kjkId), timespan: 3*oneMonth }

getKjkAuthorWorksTitles = (kjkId)->
  _.info kjkId, 'kjkId'
  url = base + getQuery(kjkId)
  requests_.get { url, headers }
  .then (res)->
    res.results.bindings
    .map (result)->
      quotation: result.title?.value
      url: result.work?.value

getQuery = (kjkId)->
  query = """
  SELECT ?work ?title WHERE {
    ?work <http://schema.org/author> <http://data.bibliotheken.nl/id/thes/p#{kjkId}> .
    ?work <http://schema.org/name> ?title .
  }
  """
  return qs.escape query
