import type { SparqlQueryParams } from '#data/wikidata/queries/queries'
import type { WdEntityId } from '#server/types/entity'

const relationProperty = 'wdt:P123'

export default {
  parameters: [ 'qid' ] as const,

  relationProperties: [ relationProperty ] as const,

  query: ({ qid: publisherId }: SparqlQueryParams) => {
    return `SELECT ?collection WHERE {
  VALUES (?collection_type) { (wd:Q20655472) (wd:Q1700470) (wd:Q2668072) } .
  ?collection wdt:P31 ?collection_type .
  ?collection ${relationProperty} wd:${publisherId} .
  OPTIONAL { ?collection wdt:P577|wdt:P580 ?starting_date }
}
ORDER BY DESC(?starting_date)`
  },

  minimizable: true,
}

export type PublisherCollections = WdEntityId[]
