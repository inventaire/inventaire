import { pick } from 'lodash-es'
import { concurrentIdsProperties, getPropertyDatatype } from '#controllers/entities/lib/properties/properties_values_constraints'
import { isNonEmptyArray } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { arrayIncludes, objectEntries } from '#lib/utils/base'
import type { SerializedEntity, EntityUri } from '#types/entity'

export function validateAbsenceOfConflictingProperties (fromEntity: SerializedEntity, toEntity: SerializedEntity) {
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

export function validateThatEntitiesAreNotRelated (fromEntity: SerializedEntity, toEntity: SerializedEntity) {
  validateThatEntityIsNotRelatedToTheOtherEntity(fromEntity, toEntity.uri)
  validateThatEntityIsNotRelatedToTheOtherEntity(toEntity, fromEntity.uri)
}

function validateThatEntityIsNotRelatedToTheOtherEntity (entity: SerializedEntity, otherEntityUri: EntityUri) {
  for (const [ property, values ] of objectEntries(entity.claims)) {
    if (getPropertyDatatype(property) === 'entity') {
      for (const value of values) {
        if (value === otherEntityUri) {
          throw newError('entities are referring to one antoher', 400, {
            entity: entity.uri,
            relatedTo: otherEntityUri,
            property,
          })
        }
      }
    }
  }
}
