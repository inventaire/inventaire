const entities_ = require('./entities')
const { unprefixify } = require('./prefix')
const getEntitiesList = require('./get_entities_list')
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
  const uris = await entitiesRelationsTemporaryCache.get(property, valueUri)
  const entities = await getEntitiesList(uris)
  return entities.map(formatEntity)
}

module.exports = { cacheEntityRelations, getCachedRelations, cachedRelationProperties }
