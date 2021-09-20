const _ = require('builders/utils')
const getEntityByUri = require('../get_entity_by_uri')
const resolveExternalIds = require('./resolve_external_ids')

const resolveSeedsByExternalIds = (seeds, expectedEntityType) => {
  return Promise.all(seeds.map(seed => resolveSeed(seed, expectedEntityType)))
}

const resolveSeed = async (seed, expectedEntityType) => {
  if (seed.uri) return seed
  const uris = await resolveExternalIds(seed.claims)
  if (uris == null) return seed
  if (uris.length === 1) {
    const uri = uris[0]
    if (expectedEntityType) {
      const { type } = await getEntityByUri({ uri })
      if (type === expectedEntityType) seed.uri = uri
    } else {
      seed.uri = uri
    }
  }
  return seed
}

const resolveSectionSeedsByExternalIds = async (section, entry, expectedEntityType) => {
  const seeds = entry[section]
  if (!_.some(seeds)) return entry

  return resolveSeedsByExternalIds(seeds, expectedEntityType)
  .then(seeds => { entry[section] = seeds })
  .then(() => entry)
}

const resolveEntrySeedsByExternalIds = async entry => {
  await Promise.all([
    resolveSectionSeedsByExternalIds('authors', entry, 'human'),
    resolveSectionSeedsByExternalIds('works', entry, 'work'),
  ])
  return entry
}

module.exports = {
  resolveEntrySeedsByExternalIds,
  resolveAuthorsByExternalIds: entry => resolveSectionSeedsByExternalIds('authors', entry, 'human'),
  resolveWorksByExternalIds: entry => resolveSectionSeedsByExternalIds('works', entry, 'work'),
}
