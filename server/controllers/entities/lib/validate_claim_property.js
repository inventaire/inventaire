const __ = require('config').universalPath
const error_ = require('lib/error/error')
const { validateProperty } = require('./properties/validations')
const propertiesPerType = require('controllers/entities/lib/properties/properties_per_type')
const assert_ = require('lib/utils/assert_types')

module.exports = (type, property) => {
  assert_.strings([ type, property ])

  validateProperty(property)

  if (!propertiesPerType[type].includes(property)) {
    throw error_.new(`${type}s can't have a property ${property}`, 400, { type, property })
  }
}
