__ = require('config').root
_ = __.require 'builders', 'utils'

valueAlreayUpToDate = (currentValue, value)->
  if currentValue is value then return true
  # booleans might arrive as string
  if _.isBoolean currentValue
    if value is currentValue.toString() then return true
  return false

basicUpdater = (attribute, value, doc)->
  # returns the doc
  return _.set doc, attribute, value

BasicUpdater = (attribute, value)->
  return basicUpdater.bind null, attribute, value

wrappedUpdater = (db, id, attribute, value)->
  db.update id, BasicUpdater(attribute, value)

WrappedUpdater = (db)-> wrappedUpdater.bind(null, db)

stringBooleanUpdater = (attribute, value, doc)->
  # in the undesired cased that it is passed anything else
  # than a boolean string, it will arbitrary default to true
  value = if value is 'false' then false else true
  return basicUpdater attribute, value, doc

module.exports =
  valueAlreayUpToDate: valueAlreayUpToDate
  basicUpdater: basicUpdater
  BasicUpdater: BasicUpdater
  wrappedUpdater: wrappedUpdater
  WrappedUpdater: WrappedUpdater
  stringBooleanUpdater: stringBooleanUpdater
