const _ = require('builders/utils')
const getEntityByUri = require('../get_entity_by_uri')
const resolveExternalIds = require('./resolve_external_ids')

const resolveSeedsByExternalIds = (seeds, expectedEntityType) => {
  console.log({ seeds, expectedEntityType })
  return Promise.all(seeds.map(seed => resolveSeed(seed, expectedEntityType)))
}

const resolveSeed = async (seed, expectedEntityType) => {
  if (expectedEntityType === 'human') console.log('resolve_by_external_ids.js', 11, { seed, expectedEntityType })
  if (seed.uri) return seed
  const uris = await resolveExternalIds(seed.claims)
  if (expectedEntityType === 'human') console.log('🚀 ~ file: resolve_by_external_ids.js ~ line 13 ~ resolveSeed ~ uris', uris)
  if (uris == null) return seed
  if (uris.length === 1) {
    const uri = uris[0]
    if (expectedEntityType) {
      if (expectedEntityType === 'human') console.log('resolve_by_external_ids.js', 19)
      const { type } = await getEntityByUri({ uri })
      if (type === expectedEntityType) seed.uri = uri
    } else {
      if (expectedEntityType === 'human') console.log('resolve_by_external_ids.js', 23)
      seed.uri = uri
    }
  }
  if (expectedEntityType === 'human') console.log('resolve_by_external_ids.js', 27, seed)
  return seed
}

const resolveSectionSeedsByExternalIds = async (section, entry, expectedEntityType) => {
  if (expectedEntityType === 'human') console.log('resolve_by_external_ids.js', 32, { section, entry, expectedEntityType })
  const seeds = entry[section]
  if (expectedEntityType === 'human') console.log('🚀 ~ file: resolve_by_external_ids.js ~ line 28 ~ resolveSectionSeedsByExternalIds ~ seeds', seeds)
  if (!_.some(seeds)) return entry

  return resolveSeedsByExternalIds(seeds, expectedEntityType)
  .then(seeds => { entry[section] = seeds })
  .then(() => entry)
  .then(_.Log('ENTRY'))
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
