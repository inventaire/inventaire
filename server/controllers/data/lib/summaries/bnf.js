const requests_ = require('lib/requests')
const cache_ = require('lib/cache')
const timeout = 10 * 1000
const { fixedEncodeURIComponent } = require('lib/utils/url')
const { sparqlResults: simplifySparqlResults } = require('wikidata-sdk').simplify

module.exports = async ({ claimValues, refresh }) => {
  const id = claimValues[0]
  const sparql = `SELECT * {
    <http://data.bnf.fr/ark:/12148/cb${id}#about> <http://purl.org/dc/terms/abstract> ?summary .
  }`
  const property = 'wdt:P268'
  const headers = { accept: '*/*' }
  const url = `https://data.bnf.fr/sparql?default-graph-uri=&format=json&timeout=${timeout}&query=${fixedEncodeURIComponent(sparql)}`
  const text = await cache_.get({
    key: `summary:${property}:${id}`,
    refresh,
    fn: async () => {
      const response = await requests_.get(url, { headers, timeout })
      const simplifiedResults = simplifySparqlResults(response)
      return simplifiedResults[0]?.summary
    }
  })
  if (text) {
    return {
      text,
      id,
      property,
      source: 'BNF',
      link: `https://catalogue.bnf.fr/ark:/12148/cb${id}`,
      lang: 'fr',
    }
  }
}
