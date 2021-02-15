module.exports = {
  parameters: [ 'qid' ],

  relationProperties: [
    'wdt:P179',
    'wdt:P361',
  ],

  query: params => {
    const { qid: serieQid } = params

    return `SELECT ?part ?date ?ordinal (COUNT(?subpart) AS ?subparts) ?superpart WHERE {
  ?part p:P179|p:P361 ?serie_statement .
  ?serie_statement ps:P179|ps:P361 wd:${serieQid} .

  # Reject circular series/parts relations
  FILTER NOT EXISTS { wd:${serieQid} wdt:P179|wdt:P361 ?part }

  # Reject parts that have an associated work (duck-typing editions)
  FILTER NOT EXISTS { ?part wdt:P629 ?work }

  # Reject parts that are instance of editions
  FILTER NOT EXISTS {
    ?part wdt:P31 wd:Q3331189
    # but recover parts that are also instances of work
    FILTER NOT EXISTS {
      VALUES (?work_type) { (wd:Q571) (wd:Q47461344) (wd:Q2831984) (wd:Q1004) (wd:Q1760610) (wd:Q8261) (wd:Q25379) (wd:Q386724) (wd:Q49084) (wd:Q8274) (wd:Q17518461) } .
      ?part wdt:P31 ?work_type .
    }
  }

  OPTIONAL { ?part wdt:P577 ?date . }
  OPTIONAL { ?part wdt:P1545 ?ordinal . }
  OPTIONAL { ?serie_statement pq:P1545 ?ordinal . }

  OPTIONAL { ?subpart wdt:P179|wdt:P361 ?part . }

  OPTIONAL {
    ?part wdt:P179|wdt:P361 ?superpart .
    ?superpart wdt:P179|wdt:P361 wd:${serieQid} .
  }

}
GROUP BY ?part ?date ?ordinal ?superpart`
  }
}
