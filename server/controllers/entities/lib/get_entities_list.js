const getEntitiesByUris = require('./get_entities_by_uris')

// A convenience function wrapping getEntitiesByUris, typically to be used in a promise chain
// ex: getSomeUris.then(getEntitiesList)

module.exports = async uris => {
  if (uris == null || uris.length === 0) return []
  return getEntitiesByUris({ uris, list: true })
}
