
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
module.exports = {
  parameters: [ 'pid', 'qid' ],
  query: params => {
    const { pid, qid } = params
    return `\
SELECT DISTINCT ?item WHERE {
  ?item wdt:${pid} wd:${qid} .
  ?item wdt:P31 wd:Q3331189 .
  # Filter-out entities tagged as both work and edition
  FILTER NOT EXISTS { ?item wdt:P31 wd:Q571 }
}
LIMIT 1000\
`
  }
}
