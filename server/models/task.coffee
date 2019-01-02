CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
assert_ = __.require 'utils', 'assert_types'
validations = require './validations/task'

module.exports =
  create: (newTask)->
    _.assertTypes arguments, [ 'object' ]
    { type, suspectUri, suggestionUri, lexicalScore, externalSourcesOccurrences } = newTask

    validations.pass 'type', type
    validations.pass 'suspectUri', suspectUri
    validations.pass 'lexicalScore', lexicalScore
    validations.pass 'externalSourcesOccurrences', externalSourcesOccurrences

    return {
      type: type
      suspectUri: suspectUri
      suggestionUri: suggestionUri
      lexicalScore: _.round lexicalScore, 2
      externalSourcesOccurrences: externalSourcesOccurrences
      created: Date.now()
    }

  update: (task, attribute, value)->
    assert_.types [ 'object', 'string', 'string|number' ], arguments

    validations.pass 'attribute', attribute
    validations.pass attribute, value

    now = Date.now()

    task[attribute] = value
    task.updated = now
    return task
