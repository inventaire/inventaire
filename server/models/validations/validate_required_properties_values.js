const error_ = require('lib/error/error')
const assert_ = require('lib/utils/assert_types')
const getEntityType = require('controllers/entities/lib/get_entity_type')
const properties = require('controllers/entities/lib/properties/properties_values_constraints')

module.exports = (claims, checkedProperties) => {
  assert_.string(claims['wdt:P31'][0])

  const type = getEntityType(claims['wdt:P31'])
  if (validateControlledPropertiesClaimsPerType[type]) {
    validateControlledPropertiesClaimsPerType[type](claims)
  }

  checkedProperties = checkedProperties || Object.keys(claims)

  checkedProperties.forEach(property => {
    validateUniqueValue(property, claims[property])
  })
}

const validateControlledPropertiesClaimsPerType = {
  edition: claims => {
    const entityLabel = 'an edition'
    assertPropertyHasValue(claims, 'wdt:P629', entityLabel, 'an associated work')
    assertPropertyHasValue(claims, 'wdt:P1476', entityLabel, 'a title')
  },

  collection: claims => {
    const entityLabel = 'a collection'
    assertPropertyHasValue(claims, 'wdt:P123', entityLabel, 'a publisher')
    assertPropertyHasValue(claims, 'wdt:P1476', entityLabel, 'a title')
  }
}

const assertPropertyHasValue = (claims, property, entityLabel, propertyLabel) => {
  if (!(claims[property] && claims[property][0] != null)) {
    const message = `${entityLabel} should have ${propertyLabel} (${property})`
    throw error_.new(message, 400, claims)
  }
}

const validateUniqueValue = (property, propertyClaims) => {
  const { uniqueValue } = properties[property]
  if (uniqueValue && propertyClaims != null && propertyClaims.length > 1) {
    throw error_.new('this property accepts only one value', 400, { property, propertyClaims })
  }
}
