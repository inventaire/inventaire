module.exports =
  parameters: ['qid']
  query: (params)->
    { qid:serieQid } = params

    """
    SELECT ?part ?date ?ordinal (COUNT(?subpart) AS ?subparts) WHERE {
      ?part p:P179|p:P361 ?serie_statement .
      ?serie_statement ps:P179|ps:P361 wd:#{serieQid} .

      # reject circular series/parts relations
      FILTER NOT EXISTS { wd:#{serieQid} wdt:P179|wdt:P361 ?part }

      # reject parts that are also subparts of another part of the serie
      FILTER NOT EXISTS {
        ?part wdt:P179|wdt:P361 ?part_b .
        ?part_b wdt:P179|wdt:P361 wd:#{serieQid} .
      }

      # reject editions
      FILTER NOT EXISTS { ?part wdt:P31 wd:Q3331189 }
      FILTER NOT EXISTS { ?part wdt:P629 ?work }

      OPTIONAL { ?part wdt:P577 ?date . }
      OPTIONAL { ?part wdt:P1545 ?ordinal . }
      OPTIONAL { ?serie_statement pq:P1545 ?ordinal . }
      OPTIONAL { ?subpart wdt:P179|wdt:P361 ?part . }
    }
    GROUP BY ?part ?date ?ordinal
    """
