const _ = require('builders/utils')
const error_ = require('lib/error/error')
const assert_ = require('lib/utils/assert_types')
const { Lang } = require('lib/regex')
const getEntityType = require('./get_entity_type')
const validateAndFormatClaims = require('./validate_and_format_claims')
const typeWithoutLabels = require('./type_without_labels')
const propertiesPerType = require('controllers/entities/lib/properties/properties_per_type')
const allowlistedTypes = Object.keys(propertiesPerType)

// Can be used to validate both entities being created or existing entities
module.exports = entity => {
  return validate(entity)
  .catch(addErrorContext(entity))
}

const validate = async entity => {
  const { _id, labels, claims } = entity
  assert_.object(labels)
  assert_.object(claims)

  const type = getValueType(claims)
  validateValueType(type, claims['wdt:P31'])
  validateLabels(labels, type)
  return validateAndFormatClaims({ claims, _id })
}

const getValueType = claims => {
  const wdtP31 = claims['wdt:P31']
  if (!_.isNonEmptyArray(wdtP31)) {
    throw error_.new("wdt:P31 array can't be empty", 400, wdtP31)
  }
  return getEntityType(wdtP31)
}

const validateValueType = (type, wdtP31) => {
  if (type == null) {
    throw error_.new("wdt:P31 value isn't a known value", 400, wdtP31)
  }

  if (!allowlistedTypes.includes(type)) {
    throw error_.new("wdt:P31 value isn't a allowlisted value", 400, wdtP31)
  }
}

const validateLabels = (labels, type) => {
  if (typeWithoutLabels[type]) {
    if (_.isNonEmptyPlainObject(labels)) {
      throw error_.new(`${type}s can't have labels`, 400, { type, labels })
    }
  } else {
    if (!_.isNonEmptyPlainObject(labels)) {
      throw error_.new('invalid labels', 400, { type, labels })
    }

    for (const lang in labels) {
      const value = labels[lang]
      if (!Lang.test(lang)) {
        throw error_.new(`invalid label language: ${lang}`, 400, { type, labels })
      }

      if (!_.isNonEmptyString(value)) {
        throw error_.new(`invalid label value: ${value}`, 400, { type, labels })
      }
    }
  }
}

const addErrorContext = entity => err => {
  if (err.context == null) err.context = { entity }
  throw err
}
