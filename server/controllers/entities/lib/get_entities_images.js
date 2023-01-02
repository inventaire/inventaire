import promises_ from '#lib/promises'
import getEntitiesByUris from './get_entities_by_uris.js'
import specialEntityImagesGetter from './special_entity_images_getter.js'
import getEntityImagesFromClaims from './get_entity_images_from_claims.js'

export default async (uris, refresh) => {
  const { entities } = await getEntitiesByUris({ uris, refresh })
  return getEntitiesImages(entities)
}

const getEntitiesImages = entities => {
  return promises_.props(Object.keys(entities).reduce(getEntityImages(entities), {}))
}

const getEntityImages = entities => (promises, id) => {
  const entity = entities[id]
  // All entities type that don't have a specialEntityImagesGetter will
  // simply return their first wdt:P18 claim value, if any
  const getter = specialEntityImagesGetter[entity.type] || getEntityImagesFromClaims
  promises[id] = getter(entity)
  return promises
}
