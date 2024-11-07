import { uniq, pick } from 'lodash-es'
import { concurrentIdsProperties } from '#controllers/entities/lib/properties/properties_values_constraints'
import { isEntityUri, isNonEmptyArray } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { arrayIncludes, objectEntries } from '#lib/utils/base'
import type { SerializedEntity } from '#server/types/entity'
import type { EntityUri, Claims } from '#types/entity'

export function validateSameExternalIdentifiersProperties (fromEntity: SerializedEntity, toEntity: SerializedEntity) {
  const fromConcurrentIdsClaims = pick(fromEntity.claims, concurrentIdsProperties)

  for (const [ property, fromValues ] of objectEntries(fromConcurrentIdsClaims)) {
    const toPropertyValues = toEntity.claims[property]
    if (isNonEmptyArray(toPropertyValues) && fromValues.some(value => !arrayIncludes(toPropertyValues, value))) {
      throw newError('entities have conflicting properties', 400, {
        fromEntityUri: fromEntity.uri,
        toEntityUri: toEntity.uri,
        conflictingProperty: property,
      })
    }
  }
}

export function validateEntitiesHaveAnyClaimLinkingToOneAnother (fromEntity: SerializedEntity, toEntity: SerializedEntity) {
  const isFromUriInRelatedEntityUris = isUriInClaimsValues(fromEntity.uri, toEntity.claims)
  const isToUriInRelatedEntityUris = isUriInClaimsValues(toEntity.uri, fromEntity.claims)

  if (isFromUriInRelatedEntityUris || isToUriInRelatedEntityUris) {
    throw newError('entities are referring to one antoher', 400, {
      fromEntityUri: fromEntity.uri,
      toEntityUri: toEntity.uri,
    })
  }
}

function isUriInClaimsValues (uri: EntityUri, claims: Claims) {
  // This should still work after adding new relation properties
  const uris = Object.values(claims)
    .flat()
    .filter(value => isEntityUri(value))
  const uniqUris = uniq(uris)

  return uniqUris.includes(uri)
}
