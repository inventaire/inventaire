// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
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
