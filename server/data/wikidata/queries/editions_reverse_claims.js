module.exports =
  parameters: [ 'pid', 'qid' ]
  query: (params)->
    { pid, qid } = params
    """
    SELECT DISTINCT ?item WHERE {
      ?item wdt:#{pid} wd:#{qid} .
      ?item wdt:P31 wd:Q3331189 .
      # Filter-out entities tagged as both work and edition
      FILTER NOT EXISTS { ?item wdt:P31 wd:Q571 }
    }
    LIMIT 1000
    """
