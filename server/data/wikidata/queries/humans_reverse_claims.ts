import { authorRelationsProperties } from '#controllers/entities/lib/properties/properties'
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
  ?item wdt:P31 wd:Q5 .

  # Keep only humans that are known for at least one contribution to a work or edition
  ?work ${authorRelationsProperties.join('|')} ?item .
  VALUES (?work_type) { ${worksP31Values.map(uri => `(${uri})`).join(' ')} }
  ?work wdt:P31 ?work_type .
}
LIMIT 1000`
  },

  minimizable: true,
}
