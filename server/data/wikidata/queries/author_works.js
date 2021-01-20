const relationProperties = [
  'wdt:P50',
  'wdt:P58',
  'wdt:P110',
  'wdt:P6338',
]

module.exports = {
  parameters: [ 'qid' ],

  relationProperties,

  query: params => {
    const { qid: authorQid } = params
    return `SELECT ?work ?type ?date ?serie WHERE {
  ?work ${relationProperties.join('|')} wd:${authorQid} .
  ?work wdt:P31 ?type .
  FILTER NOT EXISTS { ?work wdt:P31 wd:Q3331189 }
  OPTIONAL { ?work wdt:P577 ?date . }
  OPTIONAL { ?work wdt:P179 ?serie . }
  OPTIONAL { ?work wdt:P361 ?serie . }
}`
  },
}
