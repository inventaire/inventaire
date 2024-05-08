import { propertiesPerType } from '#controllers/entities/lib/properties/properties'
import { isNonEmptyArray, isNonEmptyPlainObject, isNonEmptyString } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { Lang } from '#lib/regex'
import { assert_ } from '#lib/utils/assert_types'
import { getEntityType } from './get_entity_type.js'
import { typeWithoutLabels } from './type_without_labels.js'
import validateAndFormatClaims from './validate_and_format_claims.js'

const allowlistedTypes = Object.keys(propertiesPerType)

// Can be used to validate both entities being created or existing entities
export default entity => {
  return validate(entity)
  .catch(addErrorContext(entity))
}

async function validate (entity) {
  const { _id, labels, claims } = entity
  assert_.object(labels)
  assert_.object(claims)

  const type = getValueType(claims)
  validateValueType(type, claims['wdt:P31'])
  validateLabels(labels, type)
  return validateAndFormatClaims({ _id, type, claims })
}

function getValueType (claims) {
  const wdtP31 = claims['wdt:P31']
  if (!isNonEmptyArray(wdtP31)) {
    throw newError("wdt:P31 array can't be empty", 400, wdtP31)
  }
  return getEntityType(wdtP31)
}

function validateValueType (type, wdtP31) {
  if (type == null) {
    throw newError("wdt:P31 value isn't a known value", 400, wdtP31)
  }

  if (!allowlistedTypes.includes(type)) {
    throw newError("wdt:P31 value isn't a allowlisted value", 400, wdtP31)
  }
}

function validateLabels (labels, type) {
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

const addErrorContext = entity => err => {
  if (err.context == null) err.context = { entity }
  throw err
}
