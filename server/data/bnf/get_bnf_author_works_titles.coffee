CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
qs = require 'querystring'

endpoint = 'http://data.bnf.fr/sparql'
base = "#{endpoint}?default-graph-uri=&format=json&timeout=60000&query="

module.exports = (bnfId)->
  _.info bnfId, 'bnfId'
  promises_.get base + getQuery(bnfId),
    headers:
      accept: '*/*'
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
