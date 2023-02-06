import { getEntityById } from '#controllers/entities/lib/entities'
import entitiesRelationsTemporaryCache from './entities_relations_temporary_cache.js'
import getEntitiesByUris from './get_entities_by_uris.js'
import { unprefixify } from './prefix.js'

export const cachedRelationProperties = [
  'wdt:P50',
  'wdt:P179',
]

export async function cacheEntityRelations (invEntityUri) {
  const id = unprefixify(invEntityUri)

  const { claims } = await getEntityById(id)
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

export async function getCachedRelations (valueUri, property, formatEntity) {
  const subjectUris = await entitiesRelationsTemporaryCache.get(property, valueUri)
  // Always request refreshed data to be able to confirm or not the cached relation
  const entities = await getEntitiesByUris({ uris: subjectUris, list: true, refresh: true })
  return entities
  .filter(relationIsConfirmedByPrimaryData(property, valueUri))
  .map(formatEntity)
}

export const relationIsConfirmedByPrimaryData = (property, valueUri) => entity => {
  return entity.claims[property] != null && entity.claims[property].includes(valueUri)
}
