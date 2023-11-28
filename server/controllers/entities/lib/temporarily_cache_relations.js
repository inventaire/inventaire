import { compact, map, uniq } from 'lodash-es'
import { getAggregatedPropertiesValues, getEntityById } from '#controllers/entities/lib/entities'
import { authorRelationsProperties } from '#controllers/entities/lib/properties/properties_per_type'
import entitiesRelationsTemporaryCache from './entities_relations_temporary_cache.js'
import getEntitiesByUris from './get_entities_by_uris.js'
import { unprefixify } from './prefix.js'

export const cachedRelationProperties = authorRelationsProperties.concat([
  'wdt:P179',
])

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

export async function getCachedRelations ({ valueUri, properties, formatEntity }) {
  const subjectsUris = await getSubjectsUris(valueUri, properties)
  // Always request refreshed data to be able to confirm or not the cached relation
  let entities = await getEntitiesByUris({ uris: subjectsUris, list: true, refresh: true })
  entities = await Promise.all(entities.map(relationIsConfirmedByPrimaryData(properties, valueUri)))
  return compact(entities).map(formatEntity)
}

async function getSubjectsUris (valueUri, properties) {
  const subjectsUris = await Promise.all(properties.map(property => {
    return entitiesRelationsTemporaryCache.get(property, valueUri)
  }))
  return uniq(subjectsUris.flat())
}

export const relationIsConfirmedByPrimaryData = (properties, valueUri) => async entity => {
  const relationsUris = getAggregatedPropertiesValues(entity.claims, properties)
  // Wikidata might not have propagated redirections yet, so values uris redirections need to be resolved
  const canonicalValuesUris = await getResolvedUris(relationsUris)
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
  const subjectsUris = await entitiesRelationsTemporaryCache.get(property, fromUri)
  await Promise.all(subjectsUris.flatMap(subjectUri => {
    return [
      entitiesRelationsTemporaryCache.set(subjectUri, property, toUri),
      entitiesRelationsTemporaryCache.del(subjectUri, property, fromUri),
    ]
  }))
}
