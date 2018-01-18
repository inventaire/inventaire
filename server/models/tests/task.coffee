CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ pass, entityUri } = require './common'

attributes = require '../attributes/task'

module.exports =
  pass: pass
  types: (taskType)->
    return taskType in attributes.types
  states: (taskState)->
    return taskState in attributes.states
  suspect: entityUri
