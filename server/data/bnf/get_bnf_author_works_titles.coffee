CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
requests_ = __.require 'lib', 'requests'
qs = require 'querystring'
cache_ = __.require 'lib', 'cache'

endpoint = 'http://data.bnf.fr/sparql'
base = "#{endpoint}?default-graph-uri=&format=json&timeout=60000&query="
headers = { accept: '*/*' }

module.exports = (bnfId)->
  key = "bnf:author-works-titles:#{bnfId}"
  return cache_.get key, getBnfAuthorWorksTitles.bind(null, bnfId)

getBnfAuthorWorksTitles = (bnfId)->
  _.info bnfId, 'bnfId'
  url = base + getQuery(bnfId)
  requests_.get { url, headers }
  .then (res)->
    res.results.bindings
    .map (result)->
      quotation: result.title?.value
      url: result.work?.value

getQuery = (bnfId)->
  # TODO: restrict expressions of work result to Text only
  # probably with dcterms:type dcmitype:Text
  query = """
  PREFIX dcterms: <http://purl.org/dc/terms/>
  SELECT DISTINCT ?title ?work WHERE {
    <http://data.bnf.fr/ark:/12148/cb#{bnfId}> foaf:focus ?person .
    { ?work dcterms:creator ?person ;
        rdfs:label ?title . }
    UNION
    { ?work dcterms:contributor ?person ;
        rdfs:label ?title . }
  }
  """
  return qs.escape query
