import { getEntityByUri } from '#controllers/entities/lib/get_entity_by_uri'
import { getFirstClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { allLocallyEditedEntitiesTypes } from '#controllers/entities/lib/properties/properties'
import { isNonEmptyArray, isNonEmptyPlainObject, isNonEmptyString } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { Lang } from '#lib/regex'
import { assert_ } from '#lib/utils/assert_types'
import { isLocalEntityLayer } from '#models/entity'
import type { Claims, EntityType, InvEntity, Labels, WdEntityUri } from '#server/types/entity'
import { getInvEntityType } from './get_entity_type.js'
import { typeWithoutLabels } from './type_without_labels.js'
import { validateAndFormatInvClaims } from './validate_and_format_claims.js'
import type { SetOptional } from 'type-fest'

const allowlistedTypes = allLocallyEditedEntitiesTypes
type ValidatableEntity = SetOptional<Pick<InvEntity, '_id' | 'labels' | 'claims'>, '_id'>

// Can be used to validate both entities being created or existing entities
export async function validateInvEntity (entity: ValidatableEntity) {
  try {
    return await validate(entity)
  } catch (err) {
    if (err.context == null) err.context = { entity }
    throw err
  }
}

async function validate (entity: ValidatableEntity) {
  const { _id, labels, claims } = entity
  assert_.object(labels)
  assert_.object(claims)
  const isLocalLayer = isLocalEntityLayer(entity)
  let type
  if (isLocalLayer) {
    const remoteEntityUri = getFirstClaimValue(claims, 'invp:P1')
    const remoteEntity = await getEntityByUri({ uri: remoteEntityUri })
    type = remoteEntity.type
  } else {
    type = getValueType(claims)
    validateValueType(type, claims['wdt:P31'] as WdEntityUri[])
    validateLabels(labels, type)
  }
  return validateAndFormatInvClaims({ _id, type, claims })
}

function getValueType (claims: Claims) {
  const wdtP31 = claims['wdt:P31']
  if (!isNonEmptyArray(wdtP31)) {
    throw newError("wdt:P31 array can't be empty", 400, { wdtP31 })
  }
  return getInvEntityType(wdtP31)
}

function validateValueType (type: EntityType, wdtP31: WdEntityUri[]) {
  if (type == null) {
    throw newError("wdt:P31 value isn't a known value", 400, { wdtP31 })
  }

  if (!allowlistedTypes.includes(type)) {
    throw newError("wdt:P31 value isn't a allowlisted value", 400, { wdtP31 })
  }
}

function validateLabels (labels: Labels, type: EntityType) {
  if (typeWithoutLabels.has(type)) {
    if (isNonEmptyPlainObject(labels)) {
      throw newError(`${type}s can't have labels`, 400, { type, labels })
    }
  } else {
    if (!isNonEmptyPlainObject(labels)) {
      throw newError('invalid labels', 400, { type, labels })
    }

    for (const lang in labels) {
      const value = labels[lang]
      if (!Lang.test(lang)) {
        throw newError(`invalid label language: ${lang}`, 400, { type, labels })
      }

      if (!isNonEmptyString(value)) {
        throw newError(`invalid label value: ${value}`, 400, { type, labels })
      }
    }
  }
}
