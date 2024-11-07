import { uniq, pick, intersection } from 'lodash-es'
import { externalIdsProperties } from '#controllers/entities/lib/properties/properties_values_constraints'
import { isEntityUri, isNonEmptyArray } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import type { SerializedEntity } from '#server/types/entity'
import type { EntityUri, Claims } from '#types/entity'

export function validateSameExternalIdentifiersProperties (fromEntity: SerializedEntity, toEntity: SerializedEntity) {
  const fromExternalIdsClaims = pick(fromEntity.claims, externalIdsProperties)
  const toExternalIdsClaims = pick(toEntity.claims, externalIdsProperties)

  const commonExternalIdsProperties = intersection(Object.keys(fromExternalIdsClaims), Object.keys(toExternalIdsClaims))
  if (isNonEmptyArray(commonExternalIdsProperties)) {
    throw newError(`entities have conflicting properties: ${commonExternalIdsProperties}`, 400, {
      fromEntityUri: fromEntity.uri,
      toEntityUri: toEntity.uri,
      commonExternalIdsProperties,
    })
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
