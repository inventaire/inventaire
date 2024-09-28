import type { SparqlQueryParams } from '#data/wikidata/queries/queries'
import type { InvClaimValue, PropertyUri, WdEntityId } from '#server/types/entity'

export default {
  parameters: [ 'propertyValuePairs' ] as const,
  query: (params: SparqlQueryParams) => {
    return buildQuery(params.propertyValuePairs)
  },
  minimizable: true,
}

function buildQuery (externalIds: [ PropertyUri, InvClaimValue ][]) {
  const body = buildBody(externalIds)
  return `SELECT DISTINCT ?item WHERE { ${body} }`
}

function buildBody (externalIds) {
  if (externalIds.length === 1) return buildTriple(externalIds[0])

  const unions = externalIds
    .map(buildTriple)
    .join(' } UNION { ')

  return `{ ${unions} }`
}

const buildTriple = ([ prop, value ]) => `?item ${prop} '${value}'`

export type ResolvedExternalIdsSubjects = WdEntityId[]
