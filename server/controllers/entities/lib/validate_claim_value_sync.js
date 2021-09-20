const _ = require('builders/utils')
const error_ = require('lib/error/error')
const { validateValueType, propertyType } = require('./properties/validations')
const properties = require('./properties/properties_values_constraints')
const { isEntityId } = require('lib/boolean_validations')

module.exports = (property, value, entityType) => {
  if (!validateValueType(property, value)) {
    const expected = propertyType(property)
    const actual = _.typeOf(value)
    const message = `invalid value type: expected ${expected}, got ${actual}`
    throw error_.new(message, 400, { property, value })
  }

  if (properties[property].typeSpecificValidation) {
    if (!properties[property].validate(value, entityType)) {
      const message = `invalid property value for entity type "${entityType}"`
      throw error_.new(message, 400, { entityType, property, value })
    }
  } else {
    if (!properties[property].validate(value)) {
      if (properties[property].datatype === 'entity' && isEntityId(value)) {
        throw error_.new('invalid property value: missing entity uri prefix', 400, { property, value })
      } else {
        throw error_.new('invalid property value', 400, { property, value })
      }
    }
  }
}
