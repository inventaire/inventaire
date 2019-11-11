CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
fetchExternalAuthorWorksTitles = __.require 'data', 'lib/fetch_external_author_works_titles'

endpoint = 'https://jpsearch.go.jp/rdf/sparql'

getQuery = (ndlId)->
  """
  SELECT * WHERE {
    ?work <http://schema.org/creator> <http://id.ndl.go.jp/auth/entity/#{ndlId}> .
    ?work <http://schema.org/name> ?title .
  }
  """

module.exports = fetchExternalAuthorWorksTitles 'ndl', endpoint, getQuery
