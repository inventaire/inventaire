import { compact, map } from 'lodash-es'
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
  let entities = await getEntitiesByUris({ uris: subjectUris, list: true, refresh: true })
  entities = await Promise.all(entities.map(relationIsConfirmedByPrimaryData(property, valueUri)))
  return compact(entities).map(formatEntity)
}

export const relationIsConfirmedByPrimaryData = (property, valueUri) => async entity => {
  // Wikidata might not have propagated redirections yet, so values uris redirections need to be resolved
  const canonicalValuesUris = await getResolvedUris(entity.claims[property])
  if (canonicalValuesUris.includes(valueUri)) return entity
}

async function getResolvedUris (uris) {
  if (!uris) return []
  const entities = await getEntitiesByUris({ uris, list: true, refresh: true })
  return map(entities, 'uri')
}

export async function redirectCachedRelations (fromUri, toUri) {
  await Promise.all(cachedRelationProperties.map(redirectPropertyCachedRelations(fromUri, toUri)))
}

const redirectPropertyCachedRelations = (fromUri, toUri) => async property => {
  const subjectUris = await entitiesRelationsTemporaryCache.get(property, fromUri)
  await Promise.all(subjectUris.flatMap(subjectUri => {
    return [
      entitiesRelationsTemporaryCache.set(subjectUri, property, toUri),
      entitiesRelationsTemporaryCache.del(subjectUri, property, fromUri),
    ]
  }))
}
