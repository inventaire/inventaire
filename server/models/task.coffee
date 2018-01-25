CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

module.exports = Task = {}

tests = require './tests/task'

Task.create = (newTask)->
  _.types arguments, [ 'object' ]

  { type, suspectUri, suggestionUri, state } = newTask
  state or= 'requested'

  tests.pass 'types', type
  tests.pass 'states', state
  tests.pass 'suspect', suspectUri

  now = Date.now()

  return task =
    type: type
    suspectUri: suspectUri
    suggestionUri: suggestionUri
    state: state
    createdAt: now
