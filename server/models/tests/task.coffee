CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ pass, entityUri } = require './common'

attributes = require '../attributes/task'

module.exports =
  pass: pass
  types: (taskType)-> taskType in attributes.types
  states: (taskState)-> taskState in attributes.states
  suspect: entityUri
