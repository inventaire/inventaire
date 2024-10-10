import type { InvSnakValue, PropertyUri, WdEntityId, WdPropertyId, WdPropertyUri } from '#server/types/entity'
import authorWorks, { type AuthorWorks } from './author_works.js'
import editionsReverseClaims, { type ReverseClaimsEditions } from './editions_reverse_claims.js'
import humansReverseClaims, { type ReverseClaimsHumans } from './humans_reverse_claims.js'
import publisherCollections, { type PublisherCollections } from './publisher_collections.js'
import resolveExternalIds, { type ResolvedExternalIdsTriples } from './resolve_external_ids.js'
import serieParts, { type SerieParts } from './serie_parts.js'
import worksReverseClaims, { type ReverseClaimsWorks } from './works_reverse_claims.js'

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
  editions_reverse_claims: editionsReverseClaims,
  works_reverse_claims: worksReverseClaims,
  humans_reverse_claims: humansReverseClaims,
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
  editions_reverse_claims: ReverseClaimsEditions
  works_reverse_claims: ReverseClaimsWorks
  humans_reverse_claims: ReverseClaimsHumans
  resolve_external_ids: ResolvedExternalIdsTriples
}
