CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
fetchExternalAuthorWorksTitles = __.require 'data', 'lib/fetch_external_author_works_titles'
cache_ = __.require 'lib', 'cache'
{ oneMonth } =  __.require 'lib', 'times'

endpoint = 'http://datos.bne.es/sparql'

module.exports = (bneId)->
  key = "bne:author-works-titles:#{bneId}"
  return cache_.get { key, fn: fetchExternalAuthorWorksTitles.bind(null, endpoint, getQuery(bneId)), timespan: 3*oneMonth }

getQuery = (bneId)->
  """
  SELECT ?work ?title WHERE {
    <http://datos.bne.es/resource/#{bneId}> <http://datos.bne.es/def/OP5001> ?work .
    ?work <http://datos.bne.es/def/P1001> ?title .
  }
  """
