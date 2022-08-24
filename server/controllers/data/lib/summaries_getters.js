const requests_ = require('lib/requests')
const cache_ = require('lib/cache')
const timeout = 10 * 1000
const { fixedEncodeURIComponent } = require('lib/utils/url')
const { sparqlResults: simplifySparqlResults } = require('wikidata-sdk').simplify

const summaryGettersByClaimProperty = {
  'wdt:P268': async ({ claimValues, refresh }) => {
    const id = claimValues[0]
    const sparql = `SELECT * {
      <http://data.bnf.fr/ark:/12148/cb${id}#about> <http://purl.org/dc/terms/abstract> ?summary .
    }`
    const source = 'wdt:P268'
    const headers = { accept: '*/*' }
    const url = `https://data.bnf.fr/sparql?default-graph-uri=&format=json&timeout=${timeout}&query=${fixedEncodeURIComponent(sparql)}`
    const text = await cache_.get({
      key: `summary:${source}:${id}`,
      refresh,
      fn: async () => {
        const response = await requests_.get(url, { headers, timeout })
        const simplifiedResults = simplifySparqlResults(response)
        return simplifiedResults[0]?.summary
      }
    })
    if (text) return { source, text, link: `https://catalogue.bnf.fr/ark:/12148/cb${id}` }
  },

  'wdt:P648': async ({ claimValues, refresh }) => {
    const id = claimValues[0]
    const url = `https://openlibrary.org/any/${id}.json`
    const source = 'wdt:P648'
    const text = await cache_.get({
      key: `summary:${source}:${id}`,
      refresh,
      fn: async () => {
        const { bio, description } = await requests_.get(url, { timeout })
        const text = bio || description
        if (!text) return
        if (text.value) return text.value
        else if (typeof text === 'string') return text
      }
    })
    if (text) return { source, text }
  }
}

const propertiesWithGetters = Object.keys(summaryGettersByClaimProperty)

module.exports = {
  summaryGettersByClaimProperty,
  propertiesWithGetters,
}
