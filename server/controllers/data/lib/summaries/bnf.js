import wdk from 'wikidata-sdk'
import { cache_ } from '#lib/cache'
import { requests_ } from '#lib/requests'
import { fixedEncodeURIComponent } from '#lib/utils/url'

const { simplifySparqlResults } = wdk
const timeout = 10 * 1000

export default async ({ id, refresh }) => {
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
    },
  })
  if (text) {
    return {
      text,
      name: 'BNF',
      link: `https://catalogue.bnf.fr/ark:/12148/cb${id}`,
      lang: 'fr',
    }
  }
}
