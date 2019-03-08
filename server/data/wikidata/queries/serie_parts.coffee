module.exports =
  parameters: ['qid']
  query: (params)->
    { qid:serieQid } = params

    # FILTER: reject circular series/parts relations

    """
    SELECT ?part ?date ?ordinal WHERE {
      ?part wdt:P179|wdt:P361 #{serieQid} .
      FILTER NOT EXISTS { #{serieQid} wdt:P179|wdt:P361 ?part }
      OPTIONAL { ?part wdt:P577 ?date . }
      OPTIONAL { ?part wdt:P1545 ?ordinal . }
    }
    """
