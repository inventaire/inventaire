__ = require('config').universalPath
_ = __.require 'builders', 'utils'

valueAlreayUpToDate = (currentValue, value)->
  if currentValue is value then return true
  # booleans might arrive as string
  if _.isBoolean currentValue
    if value is currentValue.toString() then return true
  return false

# the simplest doc update: set one or several key/values
basicUpdater = (attribute, value, doc)->
  # /!\ imperfect polymorphism:
  # _.extend doesn't handle deep values while _.set does
  if _.isObject attribute then return _.extend doc, attribute
  else return _.set doc, attribute, value

BasicUpdater = (attribute, value)->
  # in case key/values are passed in one object
  # value will passed undefined anyway
  return basicUpdater.bind null, attribute, value

wrappedUpdater = (db, id, attribute, value)->
  db.update id, BasicUpdater(attribute, value)

WrappedUpdater = (db)-> wrappedUpdater.bind(null, db)

module.exports =
  valueAlreayUpToDate: valueAlreayUpToDate
  basicUpdater: basicUpdater
  BasicUpdater: BasicUpdater
  wrappedUpdater: wrappedUpdater
  WrappedUpdater: WrappedUpdater
