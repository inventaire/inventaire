CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
fetchExternalAuthorWorksTitles = __.require 'data', 'lib/fetch_external_author_works_titles'
cache_ = __.require 'lib', 'cache'
{ oneMonth } =  __.require 'lib', 'times'

endpoint = 'https://jpsearch.go.jp/rdf/sparql'

module.exports = (ndlId)->
  key = "ndl:author-works-titles:#{ndlId}"
  return cache_.get { key, fn: fetchExternalAuthorWorksTitles.bind(null, endpoint, getQuery(ndlId)), timespan: 3*oneMonth }

getQuery = (ndlId)->
  """
  SELECT * WHERE {
    ?work <http://schema.org/creator> <http://id.ndl.go.jp/auth/entity/#{ndlId}> .
    ?work <http://schema.org/name> ?title .
  }
  """
