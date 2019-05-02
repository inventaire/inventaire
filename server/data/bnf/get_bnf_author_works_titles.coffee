CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
fetchExternalAuthorWorksTitles = __.require 'data', 'lib/fetch_external_author_works_titles'
cache_ = __.require 'lib', 'cache'
{ oneMonth } =  __.require 'lib', 'times'

endpoint = 'http://data.bnf.fr/sparql'

module.exports = (bnfId)->
  key = "bnf:author-works-titles:#{bnfId}"
  return cache_.get { key, fn: fetchExternalAuthorWorksTitles.bind(null, endpoint, getQuery(bnfId)), timespan: 3*oneMonth }

getQuery = (bnfId)->
  # TODO: restrict expressions of work result to Text only
  # probably with dcterms:type dcmitype:Text
  """
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
