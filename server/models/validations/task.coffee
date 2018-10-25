CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ pass, entityUri } = require './common'

attributes = require '../attributes/task'

module.exports =
  pass: pass
  # in attributes/task.coffee, attributes keys should match
  # db keys to verify if attribute is updatable
  attribute: (attribute)-> attribute in _.keys attributes
  type: (taskType)-> taskType in attributes.type
  state: (taskState)-> taskState in attributes.state
  suspectUri: entityUri
  lexicalScore: _.isNumber
  relationScore: _.isNumber
  hasEncyclopediaOccurence: _.isArray
