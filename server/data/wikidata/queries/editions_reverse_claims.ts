import type { SparqlQueryParams } from '#data/wikidata/queries/queries'
import { typesAliases } from '#lib/wikidata/aliases'

const { works: worksP31Values } = typesAliases

export default {
  parameters: [ 'pid', 'qid' ] as const,

  relationProperties: [ '*' ] as const,

  query: (params: SparqlQueryParams) => {
    const { pid, qid } = params
    return `SELECT DISTINCT ?item WHERE {
  ?item wdt:${pid} wd:${qid} .
  ?item wdt:P31 wd:Q3331189 .
  # Filter-out entities tagged as both work and edition
  VALUES (?work_type) { ${worksP31Values.map(uri => `(${uri})`).join(' ')} }
  FILTER NOT EXISTS { ?item wdt:P31 ?work_type }
}
LIMIT 1000`
  },

  minimizable: true,
}
