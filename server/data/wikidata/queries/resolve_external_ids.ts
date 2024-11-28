import type { SparqlQueryParams } from '#data/wikidata/queries/queries'
import type { InvClaimValue, PropertyUri, WdEntityId, WdPropertyId } from '#types/entity'

export default {
  parameters: [ 'propertyValuePairs' ] as const,
  query: (params: SparqlQueryParams) => {
    return buildQuery(params.propertyValuePairs)
  },
  minimizable: false,
}

function buildQuery (externalIds: [ PropertyUri, InvClaimValue ][]) {
  const body = buildBody(externalIds)
  return `SELECT ?subject ?property ?value WHERE { ${body} }`
}

function buildBody (externalIds) {
  if (externalIds.length === 1) return buildTriple(externalIds[0])

  const unions = externalIds
    .map(buildTriple)
    .join(' } UNION { ')

  return `{ ${unions} }`
}

const buildTriple = ([ property, value ]: [ PropertyUri, InvClaimValue ]) => `
  BIND(${property} AS ?property)
  BIND('${value}' AS ?value)
  ?subject ?property ?value .
`

export interface ResolvedExternalIdTriple {
  subject: WdEntityId
  property: WdPropertyId
  value: string
}

export type ResolvedExternalIdsTriples = ResolvedExternalIdTriple[]
