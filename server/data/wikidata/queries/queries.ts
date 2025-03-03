import type { InvSnakValue, PropertyUri, WdEntityId, WdPropertyId, WdPropertyUri } from '#types/entity'
import authorWorks, { type AuthorWorks } from './author_works.js'
import publisherCollections, { type PublisherCollections } from './publisher_collections.js'
import resolveExternalIds, { type ResolvedExternalIdsTriples } from './resolve_external_ids.js'
import serieParts, { type SerieParts } from './serie_parts.js'

export type PropertyValuePair = [ PropertyUri, InvSnakValue ]

export interface SparqlQueryParams {
  qid?: WdEntityId
  pid?: WdPropertyId
  externalIds?: string[]
  propertyValuePairs?: PropertyValuePair[]
}

export interface SparqlQueryBuilder {
  parameters: readonly (keyof SparqlQueryParams)[]
  relationProperties?: readonly WdPropertyUri[] | readonly [ '*' ]
  query: (params: SparqlQueryParams) => string
  minimizable: boolean
}

export const queries = {
  author_works: authorWorks,
  serie_parts: serieParts,
  publisher_collections: publisherCollections,
  resolve_external_ids: resolveExternalIds,
} as const satisfies Record<string, SparqlQueryBuilder>

export const queriesPerProperty = {}

for (const queryName in queries) {
  const { relationProperties } = queries[queryName]
  if (relationProperties) {
    relationProperties.forEach(property => {
      queriesPerProperty[property] = queriesPerProperty[property] || []
      queriesPerProperty[property].push(queryName)
    })
  }
}

export interface QueryReturnTypeByQueryName {
  author_works: AuthorWorks
  serie_parts: SerieParts
  publisher_collections: PublisherCollections
  resolve_external_ids: ResolvedExternalIdsTriples
}
