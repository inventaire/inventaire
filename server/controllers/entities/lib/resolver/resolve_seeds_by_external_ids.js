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
const _ = __.require('builders', 'utils')
const resolveExternalIds = require('./resolve_external_ids')

module.exports = seeds => Promise.all(seeds.map(resolveSeed))

var resolveSeed = seed => resolveExternalIds(seed.claims)
.then((uris) => {
  if (uris == null) return seed
  if (uris.length === 1) { seed.uri = uris[0] }
  return seed
})
