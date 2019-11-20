
const CONFIG = require('config')
const __ = CONFIG.universalPath
const { Promise } = __.require('lib', 'promises')
const getEntitiesByUris = require('./get_entities_by_uris')

// A convenience function wrapping getEntitiesByUris, typically to be used in a promise chain
// ex: getSomeUris.then(getEntitiesList)

module.exports = uris => {
  if (uris == null) return Promise.resolve([])
  return getEntitiesByUris({ uris, list: true })
}
