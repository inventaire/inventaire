CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
fetchExternalAuthorWorksTitles = __.require 'data', 'lib/fetch_external_author_works_titles'
cache_ = __.require 'lib', 'cache'
{ oneMonth } =  __.require 'lib', 'times'

endpoint = 'http://data.bibliotheken.nl/sparql'

module.exports = (kjkId)->
  key = "kjk:author-works-titles:#{kjkId}"
  return cache_.get { key, fn: fetchExternalAuthorWorksTitles.bind(null, endpoint, getQuery(kjkId)), timespan: 3*oneMonth }

getQuery = (kjkId)->
  """
  SELECT ?work ?title WHERE {
    ?work <http://schema.org/author> <http://data.bibliotheken.nl/id/thes/p#{kjkId}> .
    ?work <http://schema.org/name> ?title .
  }
  """
