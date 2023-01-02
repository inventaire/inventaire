import entities_ from './entities.js'
import { unprefixify } from './prefix.js'
import getEntitiesByUris from './get_entities_by_uris.js'
import entitiesRelationsTemporaryCache from './entities_relations_temporary_cache.js'

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

export default { cacheEntityRelations, getCachedRelations, cachedRelationProperties }
