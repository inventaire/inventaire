import getEntitiesByUris from './get_entities_by_uris.js'

// A convenience function wrapping getEntitiesByUris, typically to be used in a promise chain
// ex: getSomeUris.then(getEntitiesList)

export default async uris => {
  if (uris == null || uris.length === 0) return []
  return getEntitiesByUris({ uris, list: true })
}
