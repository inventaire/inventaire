const relationProperty = 'wdt:P123'

module.exports = {
  parameters: [ 'qid' ],

  relationProperties: [ relationProperty ],

  query: ({ qid: publisherId }) => {
    return `SELECT ?collection WHERE {
  VALUES (?collection_type) { (wd:Q20655472) (wd:Q1700470) (wd:Q2668072) } .
  ?collection wdt:P31 ?collection_type .
  ?collection ${relationProperty} wd:${publisherId} .
  OPTIONAL { ?collection wdt:P577|wdt:P580 ?starting_date }
}
ORDER BY DESC(?starting_date)`
  }
}
