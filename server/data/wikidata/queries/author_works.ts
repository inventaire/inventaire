import { authorRelationsProperties } from '#controllers/entities/lib/properties/properties'
import type { SparqlQueryParams } from '#data/wikidata/queries/queries'

export default {
  parameters: [ 'qid' ] as const,

  relationProperties: authorRelationsProperties,

  query: (params: SparqlQueryParams) => {
    const { qid: authorQid } = params
    return `SELECT ?work ?type ?date ?serie WHERE {
  ?work ${authorRelationsProperties.join('|')} wd:${authorQid} .
  ?work wdt:P31 ?type .
  FILTER NOT EXISTS { ?work wdt:P31 wd:Q3331189 }
  OPTIONAL { ?work wdt:P577 ?date . }
  OPTIONAL { ?work wdt:P179 ?serie . }
  OPTIONAL { ?work wdt:P361 ?serie . }
}`
  },
}
