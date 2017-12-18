CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

module.exports = Task = {}

tests = require './tests/task'

Task.create = ( newTask )->
  _.types arguments, [ 'object' ]

  { type, suspectUri, suggestionUri } = newTask

  tests.pass 'suspect', suspectUri

  now = Date.now()

  return task =
    type: type
    suspectUri: suspectUri
    suggestionUri: suggestionUri
    state: "requested"
    createdAt: now
