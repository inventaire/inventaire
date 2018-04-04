CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
validations = require './validations/task'

module.exports =
  create: (newTask)->
    _.types arguments, [ 'object' ]

    { type, suspectUri, suggestionUri, state, lexicalScore, relationScore, hasEncyclopediaOccurence } = newTask
    state or= 'requested'

    validations.pass 'types', type
    validations.pass 'states', state
    validations.pass 'suspect', suspectUri
    validations.pass 'lexicalScore', lexicalScore
    validations.pass 'relationScore', relationScore
    validations.pass 'hasEncyclopediaOccurence', hasEncyclopediaOccurence

    return task =
      type: type
      suspectUri: suspectUri
      suggestionUri: suggestionUri
      state: state
      lexicalScore: _.round lexicalScore, 2
      relationScore: _.round relationScore, 2
      hasEncyclopediaOccurence: hasEncyclopediaOccurence
      createdAt: Date.now()

  update: (task, attribute, value)->
    _.types arguments, [ 'object', 'string', 'string|number' ]

    validations.pass 'attributes', attribute

    # Todo : find a way to check update values according to valid attribute,
    # without the current code smell (conditonal if)
    if attribute is 'state'
      validations.pass 'states', value

    now = Date.now()

    task[attribute] = value
    task.updated = now
    return task
