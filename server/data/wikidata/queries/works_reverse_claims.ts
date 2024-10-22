import type { SparqlQueryParams } from '#data/wikidata/queries/queries'
import { typesAliases } from '#lib/wikidata/aliases'
import type { WdEntityId } from '#server/types/entity'

const { works: worksP31Values, series: seriesP31Values } = typesAliases
const worksOrSeriesP31Values = [ ...worksP31Values, ...seriesP31Values ]

export default {
  parameters: [ 'pid', 'qid' ] as const,

  relationProperties: [ '*' ] as const,

  query: (params: SparqlQueryParams) => {
    const { pid, qid } = params
    return `SELECT DISTINCT ?item WHERE {
  ?item wdt:${pid} wd:${qid} .
  VALUES (?work_type) { ${worksOrSeriesP31Values.map(uri => `(${uri})`).join(' ')} }
  ?item wdt:P31 ?work_type .
  # Filter-out entities tagged as both work and edition
  FILTER NOT EXISTS { ?item wdt:P31 wd:Q3331189 }
}
LIMIT 1000`
  },

  minimizable: true,
}

export type ReverseClaimsWorks = WdEntityId[]
