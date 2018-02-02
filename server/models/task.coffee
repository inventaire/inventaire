CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'

module.exports = Task = {}

tests = require './tests/task'

Task.create = (newTask)->
  _.types arguments, [ 'object' ]

  { type, suspectUri, suggestionUri, state, elasticScore, probability } = newTask
  state or= 'requested'

  tests.pass 'types', type
  tests.pass 'states', state
  tests.pass 'suspect', suspectUri
  tests.pass 'elasticScore', elasticScore

  now = Date.now()

  return task =
    type: type
    suspectUri: suspectUri
    suggestionUri: suggestionUri
    state: state
    elasticScore: elasticScore
    probability: probability
    createdAt: now

Task.update = (task, attribute, value)->
  _.types arguments, [ 'object', 'string', 'string' ]

  tests.pass 'attributes', attribute

  # Todo : find a way to check update values according to valid attribute,
  # without the current code smell (conditonal if)
  if attribute is 'state'
    tests.pass 'states', value

  now = Date.now()

  task[attribute] = value
  task.updated = now
  return task
