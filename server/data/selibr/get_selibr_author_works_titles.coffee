CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
fetchExternalAuthorWorksTitles = __.require 'data', 'lib/fetch_external_author_works_titles'
cache_ = __.require 'lib', 'cache'
{ oneMonth } =  __.require 'lib', 'times'

endpoint = 'http://libris.kb.se/sparql'

module.exports = (selibrId)->
  key = "selibr:author-works-titles:#{selibrId}"
  return cache_.get { key, fn: fetchExternalAuthorWorksTitles.bind(null, endpoint, getQuery(selibrId)), timespan: 3*oneMonth }

getQuery = (selibrId)->
  """
  SELECT ?work ?title {
    ?work <http://purl.org/dc/elements/1.1/creator> <http://libris.kb.se/resource/auth/#{selibrId}> .
    ?work <http://purl.org/dc/elements/1.1/title> ?title .
  }
  """
