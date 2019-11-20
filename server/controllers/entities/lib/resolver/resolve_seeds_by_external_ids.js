
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const resolveExternalIds = require('./resolve_external_ids')

module.exports = seeds => Promise.all(seeds.map(resolveSeed))

const resolveSeed = seed => resolveExternalIds(seed.claims)
.then(uris => {
  if (uris == null) return seed
  if (uris.length === 1) { seed.uri = uris[0] }
  return seed
})
