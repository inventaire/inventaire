CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
validations = require './validations/task'

module.exports =
  create: (newTask)->
    _.types arguments, [ 'object' ]
    { type, suspectUri, suggestionUri, lexicalScore, relationScore, externalSourcesOccurences } = newTask

    validations.pass 'type', type
    validations.pass 'suspectUri', suspectUri
    validations.pass 'lexicalScore', lexicalScore
    validations.pass 'relationScore', relationScore
    validations.pass 'externalSourcesOccurences', externalSourcesOccurences

    return task =
      type: type
      suspectUri: suspectUri
      suggestionUri: suggestionUri
      lexicalScore: _.round lexicalScore, 2
      relationScore: _.round relationScore, 2
      externalSourcesOccurences: externalSourcesOccurences
      created: Date.now()

  update: (task, attribute, value)->
    _.types arguments, [ 'object', 'string', 'string|number' ]

    validations.pass 'attribute', attribute
    validations.pass attribute, value

    now = Date.now()

    task[attribute] = value
    task.updated = now
    return task
