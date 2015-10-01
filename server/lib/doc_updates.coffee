__ = require('config').root
_ = __.require 'builders', 'utils'

valueAlreayUpToDate = (currentValue, value)->
  if currentValue is value then return true
  # booleans might arrive as string
  if _.isBoolean currentValue
    if value is currentValue.toString() then return true
  return false

basicUpdater = (attribute, value, doc)->
  # could be a one-line as _.set returns the doc
  # but that's more explicit as such
  _.set doc, attribute, value
  return doc

BasicUpdater = (attribute, value)->
  return basicUpdater.bind null, attribute, value

stringBooleanUpdater = (attribute, value, doc)->
  # in the undesired cased that it is passed anything else
  # than a boolean string, it will arbitrary default to true
  value = if value is 'false' then false else true
  return basicUpdater attribute, value, doc

module.exports =
  valueAlreayUpToDate: valueAlreayUpToDate
  basicUpdater: basicUpdater
  BasicUpdater: BasicUpdater
  stringBooleanUpdater: stringBooleanUpdater
