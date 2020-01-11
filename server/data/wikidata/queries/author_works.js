module.exports = {
  parameters: [ 'qid' ],
  query: params => {
    const { qid: authorQid } = params

    // P50    author
    // P58    screenwriter
    // P110   illustrator
    // P6338  colorist

    // Filter-out instances of edition (Q3331189)

    return `SELECT ?work ?type ?date ?serie WHERE {
  ?work wdt:P50|wdt:P58|wdt:P110|wdt:P6338 wd:${authorQid} .
  ?work wdt:P31 ?type .
  FILTER NOT EXISTS { ?work wdt:P31 wd:Q3331189 }
  OPTIONAL { ?work wdt:P577 ?date . }
  OPTIONAL { ?work wdt:P179 ?serie . }
  OPTIONAL { ?work wdt:P361 ?serie . }
}`
  }
}
