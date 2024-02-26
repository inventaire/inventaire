import { simplifySparqlResults } from 'wikibase-sdk'
import { cache_ } from '#lib/cache'
import { requests_ } from '#lib/requests'
import { fixedEncodeURIComponent } from '#lib/utils/url'

const timeout = 10 * 1000
const property = 'wdt:P268'

export async function getBnfSummary ({ claims, refresh }) {
  const id = claims[property]?.[0]
  if (!id) return
  const sparql = `SELECT * {
    <http://data.bnf.fr/ark:/12148/cb${id}#about> <http://purl.org/dc/terms/abstract> ?summary .
  }`
  const headers = { accept: '*/*' }
  const url = `https://data.bnf.fr/sparql?default-graph-uri=&format=json&timeout=${timeout}&query=${fixedEncodeURIComponent(sparql)}`
  const res = await cache_.get({
    key: `summary:${property}:${id}`,
    refresh,
    fn: async () => {
      const response = await requests_.get(url, { headers, timeout })
      const simplifiedResults = simplifySparqlResults(response)
      return { text: simplifiedResults[0]?.summary }
    },
  })
  if (res?.text) {
    const { text } = res
    return {
      text,
      name: 'BNF',
      link: `https://catalogue.bnf.fr/ark:/12148/cb${id}`,
      lang: 'fr',
      key: 'wdt:P268',
      claim: { id, property },
    }
  }
}
