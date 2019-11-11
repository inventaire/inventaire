__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
{ validateProperty } = require './properties/validations'
propertiesPerType = __.require 'controllers', 'entities/lib/properties/properties_per_type'
assert_ = __.require 'utils', 'assert_types'

module.exports = (type, property)->
  assert_.strings [ type, property ]

  validateProperty property

  unless property in propertiesPerType[type]
    throw error_.new "#{type}s can't have a property #{property}", 400, arguments
