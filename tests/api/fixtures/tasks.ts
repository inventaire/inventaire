import { createTasksInBulk } from '#controllers/tasks/lib/tasks'
import { getByIds } from '#tests/api/utils/tasks'
import { createHuman, createWork } from './entities.js'

export async function createTask (params) {
  let taskDoc = await createTaskBase(params)
  if (taskDoc.entitiesType && taskDoc.entitiesType === 'work') {
    taskDoc = await createWorkTaskDoc(params)
  } else {
    taskDoc = await createHumanTaskDoc(params)
  }
  const [ taskRes ] = await createTasks([ taskDoc ])
  const [ task ] = await getByIds(taskRes.id)
  return task
}

const createWorkTaskDoc = async (params = {}) => {
  const taskDoc = await createTaskBase(params)
  taskDoc.suggestionUri = params.suggestionUri || 'wd:Q104889737'
  const userId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  taskDoc.reporter = userId
  const isbn = '978-1-59184-233-0'
  taskDoc.clue = isbn
  return taskDoc
}

async function assignSuspectUri (taskDoc, params) {
  if (params.suspectUri) {
    taskDoc.suspectUri = params.suspectUri
  } else if (params.entitiesType === 'work') {
    const suspect = await createWork()
    taskDoc.suspectUri = suspect.uri
  } else {
    const suspect = await createHuman()
    taskDoc.suspectUri = suspect.uri
  }
}

async function createHumanTaskDoc (params = {}) {
  const taskDoc = await createTaskBase(params)
  taskDoc.suggestionUri = params.suggestionUri || 'wd:Q205739'
  taskDoc.lexicalScore = 12.01775
  taskDoc.relationScore = 0.1
  taskDoc.externalSourcesOccurrences = []
  return taskDoc
}

async function createTaskBase (params = {}) {
  const taskDoc = {
    type: params.type || 'deduplicate',
    entitiesType: params.entitiesType || 'human',
  }
  await assignSuspectUri(taskDoc, params)
  return taskDoc
}

const createTasks = taskDocs => {
  return createTasksInBulk(taskDocs)
}
