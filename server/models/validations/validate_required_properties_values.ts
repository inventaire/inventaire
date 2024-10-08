import { getInvEntityType } from '#controllers/entities/lib/get_entity_type'
import { propertiesValuesConstraints as properties } from '#controllers/entities/lib/properties/properties_values_constraints'
import { newError } from '#lib/error/error'
import type { Claims, PropertyUri } from '#types/entity'

export function validateRequiredPropertiesValues (claims: Claims, checkedProperties?: PropertyUri[]) {
  if (claims['wdt:P31']?.[0] == null) {
    throw newError("wdt:P31 array can't be empty", 400, { claims })
  }

  const type = getInvEntityType(claims['wdt:P31'])
  if (validateControlledPropertiesClaimsPerType[type]) {
    validateControlledPropertiesClaimsPerType[type](claims)
  }

  checkedProperties = checkedProperties || (Object.keys(claims) as PropertyUri[])

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
  },
}

function assertPropertyHasValue (claims, property, entityLabel, propertyLabel) {
  if (claims[property]?.[0] == null) {
    const message = `${entityLabel} should have ${propertyLabel} (${property})`
    throw newError(message, 400, claims)
  }
}

function validateUniqueValue (property, propertyClaims) {
  const { uniqueValue } = properties[property]
  if (uniqueValue && propertyClaims != null && propertyClaims.length > 1) {
    throw newError('this property accepts only one value', 400, { property, propertyClaims })
  }
}
