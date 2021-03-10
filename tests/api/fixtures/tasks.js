const _ = require('builders/utils')
const { createHuman, createWork } = require('./entities')
const { checkEntities } = require('../utils/tasks')
const { createInBulk } = require('controllers/tasks/lib/tasks')
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
  let suspect = {}
  let suggestionUri = ''
  if (!params.suspectUri) {
    if (params.entitiesType && params.entitiesType === 'work') {
      suspect = await createWork()
      suggestionUri = 'wd:Q104889737'
    } else {
      suspect = await createHuman()
      suggestionUri = 'wd:Q205739'
    }
  }
  return {
    type: params.type || 'deduplicate',
    entitiesType: params.entitiesType || 'human',
    suspectUri: params.suspectUri || suspect.uri,
    suggestionUri: params.suggestionUri || suggestionUri,
    lexicalScore: 12.01775,
    relationScore: 0.1,
    externalSourcesOccurrences: []
  }
}

const createTasks = taskDocs => {
  return createInBulk(taskDocs)
}
