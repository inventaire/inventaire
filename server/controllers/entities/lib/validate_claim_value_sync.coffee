__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
{ validateValueType, propertyType } = require './properties/validations'
properties = require './properties/properties_values_constraints'

module.exports = (property, value)->
  unless validateValueType property, value
    expected = propertyType property
    actual = _.typeOf value
    message = "invalid value type: expected #{expected}, got #{actual}"
    throw error_.new message, 400, { property, value }

  unless properties[property].validate value
    throw error_.new 'invalid property value', 400, { property, value }
