CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
properties = require './properties_values_constraints'
whitelist = Object.keys properties

# Which type a property value should return when passed to _.typeOf
propertyType = (property)->
  properties[property].type or properties[property].datatype

module.exports =
  propertyType: propertyType

  validateProperty: (property)->
    unless /^(wdt|invp):P\d+$/.test property
      throw error_.new 'invalid property', 400, property

    unless property in whitelist
      throw error_.new "property isn't whitelisted", 400, property

  validateValueType: (property, value)->
    _.typeOf(value) is propertyType(property)

  # Assumes that the property is valid
  validatePropertyValueSync: (property, value)->
    properties[property].validate value
