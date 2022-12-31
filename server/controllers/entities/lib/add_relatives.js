// Enrich ../by_uris results with entities related to the directly
// requested entities, following those entities claims

import _ from 'builders/utils'

import getEntitiesByUris from './get_entities_by_uris'

const addRelatives = (results, relatives, refresh) => {
  const { entities } = results

  const additionalEntitiesUris = getAdditionalEntitiesUris(entities, relatives)

  if (additionalEntitiesUris.length === 0) return results

  return getEntitiesByUris({ uris: additionalEntitiesUris, refresh })
  // Recursively add relatives, so that an edition could be sent
  // with its works, and its works authors and series
  .then(additionalResults => addRelatives(additionalResults, relatives, refresh))
  .then(additionalResults => {
    // We only need to extend entities, as those additional URIs
    // should already be the canonical URIs (no redirection needed)
    // and all URIs should resolve to an existing entity
    Object.assign(results.entities, additionalResults.entities)
    return results
  })
}

const getAdditionalEntitiesUris = (entities, relatives) => {
  return _(entities)
  .values()
  .map(getEntityRelativesUris(relatives))
  .flattenDeep()
  .uniq()
  .value()
}

const getEntityRelativesUris = relatives => entity => Object.values(_.pick(entity.claims, relatives))

export default addRelatives
