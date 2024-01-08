import { compact } from 'lodash-es'
import getEntitiesByUris from './get_entities_by_uris.js'

// A convenience function wrapping getEntitiesByUris, typically to be used in a promise chain
// ex: getSomeUris.then(getEntitiesList)

export async function getEntitiesList (uris) {
  if (uris == null) return []
  uris = compact(uris)
  if (uris.length === 0) return []
  return getEntitiesByUris({ uris, list: true })
}
