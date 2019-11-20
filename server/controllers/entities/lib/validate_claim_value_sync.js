
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const { validateValueType, propertyType } = require('./properties/validations')
const properties = require('./properties/properties_values_constraints')

module.exports = (property, value, entityType) => {
  let message
  if (!validateValueType(property, value)) {
    const expected = propertyType(property)
    const actual = _.typeOf(value)
    message = `invalid value type: expected ${expected}, got ${actual}`
    throw error_.new(message, 400, { property, value })
  }

  if (properties[property].typeSpecificValidation) {
    if (!properties[property].validate(value, entityType)) {
      message = `invalid property value for entity type ${entityType}`
      throw error_.new(message, 400, { entityType, property, value })
    }
  } else {
    if (!properties[property].validate(value)) {
      throw error_.new('invalid property value', 400, { property, value })
    }
  }
}
