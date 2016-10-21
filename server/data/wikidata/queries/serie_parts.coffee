module.exports =
  parameters: ['qid']
  query: (params)->
    { qid:serieQid } = params
    """
    SELECT ?part ?date ?rank WHERE {
      { ?part wdt:P179 wd:#{serieQid} . }
      UNION
      { ?part wdt:P361 wd:#{serieQid} . }
      OPTIONAL { ?part wdt:P577 ?date . }
      OPTIONAL { ?part wdt:P1545 ?rank . }
    }
    """
