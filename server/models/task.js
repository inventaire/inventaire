const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const assert_ = __.require('lib', 'utils/assert_types')
const validations = require('./validations/task')

module.exports = {
  create: newTask => {
    assert_.object(newTask)
    const { type, entitiesType, suspectUri, suggestionUri, externalSourcesOccurrences, reporter, clue } = newTask
    let { lexicalScore } = newTask

    validations.pass('type', type)
    validations.pass('suspectUri', suspectUri)

    const task = {
      type,
      suspectUri,
      suggestionUri,
      created: Date.now()
    }

    if (lexicalScore) lexicalScore = _.round(lexicalScore, 2)

    validateAndAssign(task, 'entitiesType', entitiesType)
    validateAndAssign(task, 'lexicalScore', lexicalScore)
    validateAndAssign(task, 'externalSourcesOccurrences', externalSourcesOccurrences)
    validateAndAssign(task, 'reporter', reporter)
    validateAndAssign(task, 'clue', clue)
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

const validateAndAssign = (task, name, attribute) => {
  if (attribute) {
    validations.pass(name, attribute)
    task[name] = attribute
  }
}
