const __ = require('config').universalPath
const promises_ = require('lib/promises')
const getEntitiesByUris = require('./get_entities_by_uris')
const specialEntityImagesGetter = require('./special_entity_images_getter')
const getEntityImagesFromClaims = require('./get_entity_images_from_claims')

module.exports = async (uris, refresh) => {
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
