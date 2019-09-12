CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
fetchExternalAuthorWorksTitles = __.require 'data', 'lib/fetch_external_author_works_titles'

endpoint = 'http://data.bibliotheken.nl/sparql'

getQuery = (kjkId)->
  """
  SELECT ?work ?title WHERE {
    ?work <http://schema.org/author> <http://data.bibliotheken.nl/id/thes/p#{kjkId}> .
    ?work <http://schema.org/name> ?title .
  }
  """

module.exports = fetchExternalAuthorWorksTitles 'kjk', endpoint, getQuery
