const _ = require('builders/utils')
const assert_ = require('lib/utils/assert_types')
const validations = require('./validations/task')

module.exports = {
  create: newTask => {
    assert_.object(newTask)
    const { type, entitiesType, suspectUri, suggestionUri, externalSourcesOccurrences, reporters, clue } = newTask
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
    validateAndAssign(task, 'reporters', reporters)
    validateAndAssign(task, 'clue', clue)
    return task
  },

  update: (task, attribute, value) => {
    assert_.object(task)
    assert_.string(attribute)
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
