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

  createTask: async params => {
    const taskDoc = await createTaskDoc(params)
    return createTasks([ taskDoc ])
    .then(tasks => tasks[0])
  }
}

const createTaskDoc = async (params = {}) => {
  let human = {}
  if (!params.suspectUri) { human = await createHuman() }
  return {
    type: params.type || 'deduplicate',
    entitiesType: params.entitiesType || 'authors',
    suspectUri: params.suspectUri || human.uri,
    suggestionUri: params.suggestionUri || 'wd:Q205739',
    lexicalScore: 12.01775,
    relationScore: 0.1,
    externalSourcesOccurrences: []
  }
}

const createTasks = taskDocs => {
  return createInBulk(taskDocs)
}
