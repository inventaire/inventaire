CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
requests_ = __.require 'lib', 'requests'
qs = require 'querystring'
cache_ = __.require 'lib', 'cache'
{ oneMonth } =  __.require 'lib', 'times'

endpoint = 'http://libris.kb.se/sparql'
base = "#{endpoint}?query="
headers = { accept: 'application/sparql-results+json' }

module.exports = (selibrId)->
  key = "selibr:author-works-titles:#{selibrId}"

  return cache_.get { key, fn: getBnbAuthorWorksTitles.bind(null, selibrId), timespan: 3*oneMonth }

getBnbAuthorWorksTitles = (selibrId)->
  _.info selibrId, 'selibrId'
  url = base + getQuery(selibrId)
  requests_.get { url, headers }
  .then (res)->
    res.results.bindings
    .map (result)->
      quotation: result.title?.value
      url: result.work?.value

getQuery = (selibrId)->
  query = """
    select ?work ?title {
       ?work <http://purl.org/dc/elements/1.1/creator> <http://libris.kb.se/resource/auth/#{selibrId}> .
       ?work <http://purl.org/dc/elements/1.1/title> ?title
    }
  """
  return qs.escape query
