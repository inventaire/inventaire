CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
fetchExternalAuthorWorksTitles = __.require 'data', 'lib/fetch_external_author_works_titles'

endpoint = 'http://bnb.data.bl.uk/sparql'

getQuery = (bnbId)->
  """
  PREFIX dct: <http://purl.org/dc/terms/>
  SELECT DISTINCT ?title ?work WHERE {
    ?work dct:creator <http://bnb.data.bl.uk/id/person/#{bnbId}>;
        dct:title ?title .
  }
  """

module.exports = fetchExternalAuthorWorksTitles 'bnb', endpoint, getQuery
