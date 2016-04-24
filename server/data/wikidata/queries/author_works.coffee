__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ getQidFromUri } = __.require 'lib', 'wikidata'

module.exports =
  parameters: ['qid']
  query: (params)->
    { qid:authorQid } = params
    """
    PREFIX wd: <http://www.wikidata.org/entity/>
    PREFIX wdt: <http://www.wikidata.org/prop/direct/>

    SELECT ?work ?date WHERE {
      ?work wdt:P50 wd:#{authorQid} .
      OPTIONAL {
        ?work wdt:P577 ?date .
      }
    }
    """

  parser: (entities)->
    _(entities)
    .map (entity)->
      work: getQidFromUri entity.work.value
      date: entity.date?.value

    # sort from the oldest to the newest with undefined date last
    .sortBy 'date'
    # then keep only the ordered work ids
    .map _.property('work')
    .value()
