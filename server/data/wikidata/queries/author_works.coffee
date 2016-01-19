__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ getQidFromUri } = __.require 'lib', 'wikidata'

module.exports =
  query: (authorQid)->
    """
    PREFIX wd: <http://www.wikidata.org/entity/>
    PREFIX wdt: <http://www.wikidata.org/prop/direct/>

    SELECT ?work ?date WHERE {
      ?work wdt:P50 wd:#{authorQid} .
      OPTIONAL {
        ?work wdt:P577 ?date .
      }
    }
    ORDER BY ASC(?date)
    """

  parser: (items)->
    _(items)
    .map (item)->
      work: getQidFromUri item.work.value
      date: item.date?.value

    # sort from the oldest to the newest with undefined date last
    .sortBy 'date'
    # then keep only the ordered work ids
    .map _.property('work')
    .value()
