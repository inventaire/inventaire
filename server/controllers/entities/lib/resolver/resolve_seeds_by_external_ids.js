const resolveExternalIds = require('./resolve_external_ids')

module.exports = seeds => Promise.all(seeds.map(resolveSeed))

const resolveSeed = seed => {
  return resolveExternalIds(seed.claims)
  .then(uris => {
    if (uris == null) return seed
    if (uris.length === 1) { seed.uri = uris[0] }
    return seed
  })
}
