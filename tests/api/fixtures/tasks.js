const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { createHuman } = require('./entities')
const { checkEntities } = require('../utils/tasks')
const { createInBulk } = __.require('controllers', 'tasks/lib/tasks')
const promises = {}

module.exports = {
  createSomeTasks: humanLabel => {
    if (promises[humanLabel] != null) return promises[humanLabel]

    const human = { labels: { en: humanLabel } }

    promises[humanLabel] = Promise.all([ createHuman(human), createHuman(human) ])
      .then(humans => {
        return checkEntities(_.map(humans, 'uri'))
        .then(tasks => ({ tasks, humans }))
      })

    return promises[humanLabel]
  },

  createTask: params => {
    const taskDoc = createTaskDoc(params)
    return createTasks([ taskDoc ])
    .then(tasks => tasks[0])
  }
}

const createTaskDoc = params => {
  const suggestionUri = params.suggestionUri || 'wd:Q205739'
  const suspectUri = params.suspectUri || 'inv:00000000000000000000000000000000'

  return {
    type: 'deduplicate',
    suspectUri,
    suggestionUri,
    lexicalScore: 12.01775,
    externalSourcesOccurrences: []
  }
}

const createTasks = taskDocs => {
  return createInBulk(taskDocs)
}
