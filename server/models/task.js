const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const assert_ = __.require('utils', 'assert_types')
const validations = require('./validations/task')

module.exports = {
  create: newTask => {
    assert_.object(newTask)
    const { type, suspectUri, suggestionUri, lexicalScore, externalSourcesOccurrences } = newTask

    validations.pass('type', type)
    validations.pass('suspectUri', suspectUri)

    const task = {
      type,
      suspectUri,
      suggestionUri,
      created: Date.now()
    }

    if (lexicalScore) {
      validations.pass('lexicalScore', lexicalScore)
      _.extend(task, {
        lexicalScore: _.round(lexicalScore, 2)
      })
    }

    if (externalSourcesOccurrences) {
      validations.pass('externalSourcesOccurrences', externalSourcesOccurrences)
      _.extend(task, {
        externalSourcesOccurrences
      })
    }
    return task
  },

  update: (task, attribute, value) => {
    assert_.object(task)
    assert_.string(attribute)
    // Accept an undefined state value as that's the default state
    if (value || attribute !== 'state') assert_.type('string|number', value)

    validations.pass('attribute', attribute)
    validations.pass(attribute, value)

    const now = Date.now()

    task[attribute] = value
    task.updated = now
    return task
  }
}
