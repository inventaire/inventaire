import { compact, map, uniq } from 'lodash-es'
import { getAggregatedPropertiesValues, getEntityById } from '#controllers/entities/lib/entities'
import { getEntitiesList } from '#controllers/entities/lib/get_entities_list'
import { getClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { propertiesValuesConstraints, getPropertyDatatype } from '#controllers/entities/lib/properties/properties_values_constraints'
import { objectKeys } from '#lib/utils/types'
import type { EntityUri, InvEntityUri, PropertyUri, SerializedEntity } from '#types/entity'
import entitiesRelationsTemporaryCache from './entities_relations_temporary_cache.js'
import { unprefixify } from './prefix.js'

export const cachedRelationProperties = objectKeys(propertiesValuesConstraints)
  .filter(property => getPropertyDatatype(property) === 'entity')

export async function cacheEntityRelations (invEntityUri: InvEntityUri) {
  const id = unprefixify(invEntityUri)

  const entity = await getEntityById(id)
  if (!('claims' in entity)) return []
  const { claims } = entity

  const promises = []

  for (const property of cachedRelationProperties) {
    if (claims[property]) {
      for (const claim of claims[property]) {
        const valueUri = getClaimValue(claim) as EntityUri
        const promise = entitiesRelationsTemporaryCache.set(invEntityUri, property, valueUri)
        promises.push(promise)
      }
    }
  }

  return Promise.all(promises)
}

interface GetCachedRelationsParams <T> {
  valueUri: EntityUri
  properties: PropertyUri[]
  formatEntity: (entity: SerializedEntity) => T
}
export async function getCachedRelations <T> ({ valueUri, properties, formatEntity }: GetCachedRelationsParams<T>) {
  const subjectsUris = await getSubjectsUris(valueUri, properties)
  // Always request refreshed data to be able to confirm or not the cached relation
  let entities = await getEntitiesList(subjectsUris, { refresh: true })
  entities = await Promise.all(entities.map(relationIsConfirmedByPrimaryData(properties, valueUri)))
  return compact(entities).map(formatEntity)
}

async function getSubjectsUris (valueUri: EntityUri, properties: PropertyUri[]) {
  const subjectsUris = await Promise.all(properties.map(property => {
    return entitiesRelationsTemporaryCache.get(property, valueUri)
  }))
  return uniq(subjectsUris.flat()) as EntityUri[]
}

export function relationIsConfirmedByPrimaryData (properties: PropertyUri[], valueUri: EntityUri) {
  return async function (entity: SerializedEntity) {
    const relationsUris = getAggregatedPropertiesValues(entity.claims, properties) as EntityUri[]
    // Wikidata might not have propagated redirections yet, so values uris redirections need to be resolved
    const canonicalValuesUris = await getResolvedUris(relationsUris)
    if (canonicalValuesUris.includes(valueUri)) return entity
  }
}

async function getResolvedUris (uris: EntityUri[]) {
  if (!uris) return []
  const entities = await getEntitiesList(uris, { refresh: true })
  return map(entities, 'uri')
}

export async function redirectCachedRelations (fromUri: EntityUri, toUri: EntityUri) {
  await Promise.all(cachedRelationProperties.map(redirectPropertyCachedRelations(fromUri, toUri)))
}

const redirectPropertyCachedRelations = (fromUri: EntityUri, toUri: EntityUri) => async (property: PropertyUri) => {
  const subjectsUris = await entitiesRelationsTemporaryCache.get(property, fromUri)
  await Promise.all(subjectsUris.flatMap((subjectUri: EntityUri) => {
    return [
      entitiesRelationsTemporaryCache.set(subjectUri, property, toUri),
      entitiesRelationsTemporaryCache.del(subjectUri, property, fromUri),
    ]
  }))
}
