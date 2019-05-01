CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
requests_ = __.require 'lib', 'requests'
qs = require 'querystring'
cache_ = __.require 'lib', 'cache'
{ oneMonth } =  __.require 'lib', 'times'

endpoint = 'http://bnb.data.bl.uk/sparql'
base = "#{endpoint}?query="
headers = { accept: 'application/sparql-results+json' }

module.exports = (bnbId)->
  key = "bnb:author-works-titles:#{bnbId}"
  return cache_.get { key, fn: getBnbAuthorWorksTitles.bind(null, bnbId), timespan: 3*oneMonth }

getBnbAuthorWorksTitles = (bnbId)->
  _.info bnbId, 'bnbId'
  url = base + getQuery(bnbId)
  requests_.get { url, headers }
  .then (res)->
    res.results.bindings
    .map (result)->
      quotation: result.title?.value
      url: result.work?.value

getQuery = (bnbId)->
  # TODO: restrict expressions of work result to Text only
  # probably with dcterms:type dcmitype:Text
  query = """
  PREFIX dct: <http://purl.org/dc/terms/>
  SELECT DISTINCT ?title ?work WHERE {
    ?work dct:creator <http://bnb.data.bl.uk/id/person/#{bnbId}>;
        dct:title ?title .
  }
  """
  return qs.escape query
