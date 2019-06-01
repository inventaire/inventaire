module.exports =
  parameters: ['qid']
  query: (params)->
    { qid:serieQid } = params

    # FILTERS:
    # - reject circular series/parts relations
    # - reject parts that are also subparts of another part of the serie
    # - reject editions

    """
    SELECT ?part ?date ?ordinal WHERE {
      ?part p:P179|p:P361 ?serie_statement .
      ?serie_statement ps:P179|ps:P361 wd:#{serieQid} .
      FILTER NOT EXISTS { wd:#{serieQid} wdt:P179|wdt:P361 ?part }
      FILTER NOT EXISTS {
        ?part wdt:P179|wdt:P361 ?part_b
        ?part_b wdt:P179|wdt:P361 wd:#{serieQid} .
      }
      FILTER NOT EXISTS { ?part wdt:P31 wd:Q3331189 }
      FILTER NOT EXISTS { ?part wdt:P629 ?work }
      OPTIONAL { ?part wdt:P577 ?date . }
      OPTIONAL { ?part wdt:P1545 ?ordinal . }
      OPTIONAL { ?serie_statement pq:P1545 ?ordinal . }
    }
    """
