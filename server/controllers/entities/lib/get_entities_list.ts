import { compact } from 'lodash-es'
import type { EntityUri } from '#types/entity'
import { getEntitiesByUris, type GetEntitiesByUrisParams } from './get_entities_by_uris.js'

// A convenience function wrapping getEntitiesByUris, typically to be used in a promise chain
// ex: getSomeUris.then(getEntitiesList)

export async function getEntitiesList (uris: EntityUri[], params: Omit<GetEntitiesByUrisParams, 'uris'> = {}) {
  if (uris == null) return []
  uris = compact(uris)
  if (uris.length === 0) return []
  const { entities } = await getEntitiesByUris({ uris, ...params })
  return Object.values(entities)
}
