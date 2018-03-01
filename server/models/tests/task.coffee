CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ pass, entityUri } = require './common'

attributes = require '../attributes/task'

module.exports =
  pass: pass
  # in attributes/task.coffee, attributes keys should match
  # db keys to verify if attribute is updatable
  attributes: (attribute)-> attribute in _.keys attributes
  types: (taskType)-> taskType in attributes.type
  states: (taskState)-> taskState in attributes.state
  suspect: entityUri
  lexicalScore: _.isNumber
  relationScore: _.isNumber
  hasEncyclopediaOccurence: _.isBoolean
