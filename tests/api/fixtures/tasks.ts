import { createTasksInBulk } from '#controllers/tasks/lib/tasks'
import { getByIds } from '../utils/tasks.js'
import { createHuman, createWork } from './entities.js'

const promises = {}

export function createSomeTasks (humanLabel) {
  if (promises[humanLabel] != null) return promises[humanLabel]

  const human = { labels: { en: humanLabel } }

  promises[humanLabel] = Promise.all([ createHuman(human), createHuman(human) ])
    .then(humans => {
      return checkEntities(map(humans, 'uri'))
      .then(tasks => ({ tasks, humans }))
    })

  return promises[humanLabel]
}

export async function createTask (params) {
  const taskDoc = await createTaskDoc(params)
  const taskRes = await createTasks([ taskDoc ])
  .then(tasks => tasks[0])
  const tasks = await getByIds(taskRes.id)
  return tasks[0]
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
    externalSourcesOccurrences: [],
  }
}

const createTasks = taskDocs => {
  return createTasksInBulk(taskDocs)
}
