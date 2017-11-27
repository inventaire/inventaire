CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

module.exports = Task = {}

tests = require './tests/task'

Task.create = (suspect, suggestion)->
  _.types arguments, [ 'string', 'string' ]

  tests.pass 'suspect', suspect

  now = Date.now()

  return task =
    type: "task"
    suspectUri: suspect
    suggestionUri: suggestion
    state: 'requested'
    createdAt: now
