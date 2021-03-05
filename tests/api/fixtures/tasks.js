const { createHuman, createWork } = require('./entities')
const { createInBulk } = require('controllers/tasks/lib/tasks')

module.exports = {
  createTask: async params => {
    const taskDoc = await createTaskDoc(params)
    return createInBulk([ taskDoc ])
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
