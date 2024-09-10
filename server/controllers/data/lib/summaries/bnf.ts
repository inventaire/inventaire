import { simplifySparqlResults } from 'wikibase-sdk'
import { getFirstClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { cache_ } from '#lib/cache'
import { requests_ } from '#lib/requests'
import { fixedEncodeURIComponent } from '#lib/utils/url'
import type { AbsoluteUrl } from '#types/common'

const timeout = 10 * 1000
const property = 'wdt:P268'

export async function getBnfSummary ({ claims, refresh }) {
  const id = getFirstClaimValue(claims, property)
  if (!id) return
  const sparql = `SELECT * {
    <http://data.bnf.fr/ark:/12148/cb${id}#about> <http://purl.org/dc/terms/abstract> ?summary .
  }`
  const headers = { accept: '*/*' }
  const url: AbsoluteUrl = `https://data.bnf.fr/sparql?default-graph-uri=&format=json&timeout=${timeout}&query=${fixedEncodeURIComponent(sparql)}`
  const res = await cache_.get({
    key: `summary:${property}:${id}`,
    refresh,
    fn: async () => {
      const response = await requests_.get(url, { headers, timeout })
      const simplifiedResults = simplifySparqlResults(response)
      let text
      if (simplifiedResults.length > 0) {
        text = simplifiedResults[0].summary
      }
      return { text }
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
