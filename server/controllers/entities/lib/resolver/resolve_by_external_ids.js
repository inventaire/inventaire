import _ from '#builders/utils'
import { isWdEntityUri } from '#lib/boolean_validations'
import getEntityByUri from '../get_entity_by_uri.js'
import resolveExternalIds from './resolve_external_ids.js'

const resolveSeedsByExternalIds = (seeds, expectedEntityType) => {
  return Promise.all(seeds.map(seed => resolveSeed(seed, expectedEntityType)))
}

const resolveSeed = async (seed, expectedEntityType) => {
  if (seed.uri) return seed
  const uris = await resolveExternalIds(seed.claims)
  if (uris == null) return seed
  let uri
  if (uris.length === 1) {
    uri = uris[0]
  } else if (uris.length > 1) {
    // There is no test for this, as this condition should not be possible to create,
    // other than by setting an external id already set on existing local entity on a Wikidata entity,
    // or alternatively, by bypassing local checks and writting directly in the database
    _.warn({ uris, claims: seed.claims }, 'resolveExternalIds found too many uris, those are likely duplicates')
    const wdUris = uris.filter(isWdEntityUri)
    // Use a Wikidata uri in priority, but if there are none,
    // use any of the remaining uris, rather than not resolving on any entity,
    // Not resolving would mean letting create_unresolved_entry run and fail
    // as it will get a "this property value is already used" error
    uri = (wdUris.length > 0) ? wdUris[0] : uris[0]
  }
  if (uri) {
    if (expectedEntityType) {
      const { type } = await getEntityByUri({ uri })
      if (type === expectedEntityType) seed.uri = uri
      // Else: the seed is not resolved, and create_unresolved_entry might attempt
      // to create an entity with an existing external id, triggering
      // an error "this property value is already used"
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

export default {
  resolveEntrySeedsByExternalIds,
  resolveAuthorsByExternalIds: entry => resolveSectionSeedsByExternalIds('authors', entry, 'human'),
  resolveWorksByExternalIds: entry => resolveSectionSeedsByExternalIds('works', entry, 'work'),
}
