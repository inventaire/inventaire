import { workAuthorRelationsProperties } from '#controllers/entities/lib/properties/properties'
import type { SparqlQueryParams } from '#data/wikidata/queries/queries'
import type { WdEntityId } from '#server/types/entity'

export default {
  parameters: [ 'qid' ] as const,

  relationProperties: workAuthorRelationsProperties,

  query: (params: SparqlQueryParams) => {
    const { qid: authorQid } = params
    return `SELECT ?work ?type ?date ?serie WHERE {
  ?work ${workAuthorRelationsProperties.join('|')} wd:${authorQid} .
  ?work wdt:P31 ?type .
  FILTER NOT EXISTS { ?work wdt:P31 wd:Q3331189 }
  OPTIONAL { ?work wdt:P577 ?date . }
  OPTIONAL { ?work wdt:P179 ?serie . }
  OPTIONAL { ?work wdt:P361 ?serie . }
}`
  },

  minimizable: false,
}

export interface AuthorWork {
  work: WdEntityId
  type: WdEntityId
  date?: string
  serie?: WdEntityId
}

export type AuthorWorks = AuthorWork[]
