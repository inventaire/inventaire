__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ getQidFromUri } = __.require 'lib', 'wikidata/wikidata'

module.exports =
  parameters: ['pid', 'qid']
  query: (params)->
    { pid, qid, limit } = params

    limit = Number limit
    # using _.typeOf instead of _.isNumber to catch NaN
    unless _.typeOf(limit) is 'number' and limit < 5000
      limit = 500

    """
    SELECT ?entity WHERE {
      ?entity wdt:#{pid} wd:#{qid} .
    }
    LIMIT #{limit}
    """

  parser: (entities)-> entities.map parseEntity

parseEntity = (entity)-> getQidFromUri entity.entity.value
