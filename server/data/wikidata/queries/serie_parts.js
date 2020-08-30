module.exports = {
  parameters: [ 'qid' ],
  query: params => {
    const { qid: serieQid } = params
    // Reject circular series/parts relations
    // Reject parts that have an associated work (duck-typing editions)
    // Reject parts that are instance of editions (Q3331189)
    // but recover parts that are also instances of work

    // Work types:
    // Q571       book
    // Q47461344  written work
    // Q7725634   literary work
    // Q2831984   comic book album
    // Q1004      comic
    // Q1760610   comic book
    // Q8274      manga

    return `SELECT ?part ?date ?ordinal (COUNT(?subpart) AS ?subparts) ?superpart WHERE {
  ?part p:P179|p:P361 ?serie_statement .
  ?serie_statement ps:P179|ps:P361 wd:${serieQid} .

  FILTER NOT EXISTS { wd:${serieQid} wdt:P179|wdt:P361 ?part }

  FILTER NOT EXISTS { ?part wdt:P629 ?work }

  FILTER NOT EXISTS {
    ?part wdt:P31 wd:Q3331189
    FILTER NOT EXISTS {
      VALUES (?work_type) { (wd:Q571) (wd:Q47461344) (wd:Q7725634) (wd:Q2831984) (wd:Q1004) (wd:Q1760610) (wd:Q8274) } .
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
