const entities_ = require('./entities')
const { unprefixify } = require('./prefix')
const getEntitiesByUris = require('./get_entities_by_uris')
const entitiesRelationsTemporaryCache = require('./entities_relations_temporary_cache')
const cachedRelationProperties = [
  'wdt:P50',
  'wdt:P179'
]

const cacheEntityRelations = async invEntityUri => {
  const id = unprefixify(invEntityUri)

  const { claims } = await entities_.byId(id)
  const promises = []

  for (const property of cachedRelationProperties) {
    if (claims[property]) {
      for (const valueUri of claims[property]) {
        const promise = entitiesRelationsTemporaryCache.set(invEntityUri, property, valueUri)
        promises.push(promise)
      }
    }
  }

  return Promise.all(promises)
}

const getCachedRelations = async (valueUri, property, formatEntity) => {
  const subjectUris = await entitiesRelationsTemporaryCache.get(property, valueUri)
  // Always request refreshed data to be able to confirm or not the cached relation
  const entities = await getEntitiesByUris({ uris: subjectUris, list: true, refresh: true })
  return entities
  .filter(relationIsConfirmedByPrimaryData(property, valueUri))
  .map(formatEntity)
}

const relationIsConfirmedByPrimaryData = (property, valueUri) => entity => {
  return entity.claims[property] != null && entity.claims[property].includes(valueUri)
}

module.exports = { cacheEntityRelations, getCachedRelations, cachedRelationProperties }
