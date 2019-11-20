const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const { validateProperty } = require('./properties/validations')
const propertiesPerType = __.require('controllers', 'entities/lib/properties/properties_per_type')
const assert_ = __.require('utils', 'assert_types')

module.exports = (type, property) => {
  assert_.strings([ type, property ])

  validateProperty(property)

  if (!propertiesPerType[type].includes(property)) {
    throw error_.new(`${type}s can't have a property ${property}`, 400, { type, property })
  }
}
