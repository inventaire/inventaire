// Enrich ../by_uris results with entities related to the directly
// requested entities, following those entities claims

import { chain, pick } from 'lodash-es'
import type { PropertyUri, SerializedEntitiesByUris } from '#types/entity'
import { getEntitiesByUris, type EntitiesByUrisResults } from './get_entities_by_uris.js'

export async function addRelatives (results: EntitiesByUrisResults, relatives: PropertyUri[], refresh: boolean) {
  const { entities } = results

  const additionalEntitiesUris = getAdditionalEntitiesUris(entities, relatives)

  if (additionalEntitiesUris.length === 0) return results

  let additionalResults = await getEntitiesByUris({ uris: additionalEntitiesUris, refresh })
  // Recursively add relatives, so that an edition could be sent
  // with its works, and its works authors and series
  additionalResults = await addRelatives(additionalResults, relatives, refresh)
  // We only need to extend entities, as those additional URIs
  // should already be the canonical URIs (no redirection needed)
  // and all URIs should resolve to an existing entity
  Object.assign(results.entities, additionalResults.entities)
  return results
}

function getAdditionalEntitiesUris (entities: SerializedEntitiesByUris, relatives: PropertyUri[]) {
  return chain(entities)
  .values()
  .map(getEntityRelativesUris(relatives))
  .flattenDeep()
  .uniq()
  .value()
}

const getEntityRelativesUris = relatives => entity => Object.values(pick(entity.claims, relatives))
