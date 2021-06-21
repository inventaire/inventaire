const _ = require('builders/utils')
const resolveExternalIds = require('./resolve_external_ids')

const resolveSeedsByExternalIds = seeds => Promise.all(seeds.map(resolveSeed))

const resolveSeed = async seed => {
  if (seed.uri) return seed
  const uris = await resolveExternalIds(seed.claims)
  if (uris == null) return seed
  if (uris.length === 1) seed.uri = uris[0]
  return seed
}

const resolveSectionSeedsByExternalIds = async (section, entry) => {
  const seeds = entry[section]
  if (!_.some(seeds)) return entry

  return resolveSeedsByExternalIds(seeds)
  .then(seeds => { entry[section] = seeds })
  .then(() => entry)
}

const resolveEntrySeedsByExternalIds = async entry => {
  await Promise.all([
    resolveSectionSeedsByExternalIds('authors', entry),
    resolveSectionSeedsByExternalIds('works', entry),
  ])
  return entry
}

module.exports = {
  resolveSeedsByExternalIds,
  resolveEntrySeedsByExternalIds,
  resolveAuthorsByExternalIds: resolveSectionSeedsByExternalIds.bind(null, 'authors'),
  resolveWorksByExternalIds: resolveSectionSeedsByExternalIds.bind(null, 'works'),
}
