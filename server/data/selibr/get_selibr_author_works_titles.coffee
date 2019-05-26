CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
fetchExternalAuthorWorksTitles = __.require 'data', 'lib/fetch_external_author_works_titles'

endpoint = 'http://libris.kb.se/sparql'

getQuery = (selibrId)->
  """
  SELECT ?work ?title {
    ?work <http://purl.org/dc/elements/1.1/creator> <http://libris.kb.se/resource/auth/#{selibrId}> .
    ?work <http://purl.org/dc/elements/1.1/title> ?title .
  }
  """

module.exports = fetchExternalAuthorWorksTitles 'selibr', endpoint, getQuery
