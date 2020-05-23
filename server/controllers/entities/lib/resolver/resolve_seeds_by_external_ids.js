const resolveExternalIds = require('./resolve_external_ids')

module.exports = seeds => Promise.all(seeds.map(resolveSeed))

const resolveSeed = async seed => {
  const uris = await resolveExternalIds(seed.claims)
  if (uris == null) return seed
  if (uris.length === 1) seed.uri = uris[0]
  return seed
}
