CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
fetchExternalAuthorWorksTitles = __.require 'data', 'lib/fetch_external_author_works_titles'
cache_ = __.require 'lib', 'cache'
{ oneMonth } =  __.require 'lib', 'times'

endpoint = 'http://bnb.data.bl.uk/sparql'

module.exports = (bnbId)->
  key = "bnb:author-works-titles:#{bnbId}"
  return cache_.get { key, fn: fetchExternalAuthorWorksTitles.bind(null, endpoint, getQuery(bnbId)), timespan: 3*oneMonth }

getQuery = (bnbId)->
  """
  PREFIX dct: <http://purl.org/dc/terms/>
  SELECT DISTINCT ?title ?work WHERE {
    ?work dct:creator <http://bnb.data.bl.uk/id/person/#{bnbId}>;
        dct:title ?title .
  }
  """
