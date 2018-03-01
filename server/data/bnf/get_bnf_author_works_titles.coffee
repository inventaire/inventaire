CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
qs = require 'querystring'

endpoint = "http://data.bnf.fr/sparql"
base = "#{endpoint}?default-graph-uri=&format=json&timeout=60000&query="

module.exports = (bnfId)->
  _.info bnfId, 'bnfId'
  promises_.get base + getQuery(bnfId),
    headers:
      accept: '*/*'
  .then (res)->
    res.results.bindings
    .map (result)-> result.title?.value

getQuery = (bnfId)->
  query = """
  SELECT DISTINCT ?title WHERE {
    <http://data.bnf.fr/ark:/12148/cb#{bnfId}> foaf:focus ?person .
    ?work dcterms:creator ?person ;
        rdfs:label ?title .
  }
  """
  return qs.escape query
