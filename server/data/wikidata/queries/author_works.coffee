module.exports =
  parameters: ['qid']
  query: (params)->
    { qid:authorQid } = params
    """
    SELECT ?work ?type ?date WHERE {
      ?work wdt:P50 wd:#{authorQid} .
      ?work wdt:P31 ?type .
      OPTIONAL {
        ?work wdt:P577 ?date .
      }
    }
    """
