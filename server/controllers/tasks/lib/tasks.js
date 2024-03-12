import { groupBy, zip } from 'lodash-es'
import dbFactory from '#db/couchdb/base'
import { mappedArrayPromise } from '#lib/promises'
import Task from '#models/task'

const db = await dbFactory('tasks')

export async function createTasksFromSuggestions ({ suspectUri, type, entitiesType, suggestions }) {
  // suggestions may only be an array of objects with a 'uri' key
  const newTasksObjects = suggestions.map(suggestion => {
    const { lexicalScore, uri: suggestionUri, occurrences, reporter, clue } = suggestion

    const newTask = { type, suspectUri, suggestionUri }

    assignKeyIfExists(newTask, 'entitiesType', entitiesType)
    assignKeyIfExists(newTask, 'lexicalScore', lexicalScore)
    assignKeyIfExists(newTask, 'reporter', reporter)
    assignKeyIfExists(newTask, 'externalSourcesOccurrences', occurrences)
    assignKeyIfExists(newTask, 'clue', clue)
    return newTask
  })
  return createTasksInBulk(newTasksObjects)
}

export async function createTasksInBulk (tasksDocs) {
  const tasks = tasksDocs.map(Task.create)
  return db.bulk(tasks)
}

export async function updateTask (options) {
  const { ids, attribute, newValue } = options
  if (ids.length === 0) return []

  return getTasksByIds(ids)
  .then(mappedArrayPromise(task => Task.update(task, attribute, newValue)))
  .then(db.bulk)
}

export const bulkDeleteTasks = db.bulkDelete

export const getTaskById = db.get

export const getTasksByIds = db.byIds

export const getTasksByScore = options => {
  const { limit, offset } = options
  return db.viewCustom('byScore', {
    limit,
    skip: offset,
    descending: true,
    include_docs: true,
  })
}

export const getTasksByEntitiesType = options => {
  // Only tasks with a key `reporter` will be requested.
  // To query tasks without, see getTasksByScore
  const { type, entitiesType, limit, offset } = options
  return db.viewCustom('byTypeAndEntitiesType', {
    startkey: [ type, entitiesType ],
    endkey: [ type, entitiesType ],
    limit,
    skip: offset,
    include_docs: true,
  })
}

export const getTasksBySuspectUri = (suspectUri, options) => {
  return getTasksBySuspectUris([ suspectUri ], options)
}

export const getTasksBySuspectUriAndState = (suspectUri, state) => {
  return db.viewByKey('bySuspectUriAndState', [ suspectUri, state ])
}

export const getTasksBySuggestionUri = suggestionUri => {
  return db.viewByKey('bySuggestionUriAndState', [ suggestionUri, null ])
}

export async function getTasksBySuspectUrisAndType (uris, types) {
  const keys = zip(uris, types)
  const tasks = await db.viewByKeys('bySuspectUriAndType', keys)
  return indexByTasksKey(tasks, 'suspectUri', uris)
}

export async function getTasksBySuspectUris (uris, options = {}) {
  const { index, includeArchived } = options
  const tasks = await db.viewByKeys('bySuspectUriAndState', getKeys(uris, includeArchived))
  if (index !== true) return tasks
  return indexByTasksKey(tasks, 'suspectUri', uris)
}

export async function getTasksBySuggestionUris (uris, options = {}) {
  const { index, includeArchived } = options
  const tasks = await db.viewByKeys('bySuggestionUriAndState', getKeys(uris, includeArchived))
  if (index !== true) return tasks
  return indexByTasksKey(tasks, 'suggestionUri', uris)
}

function indexByTasksKey (tasks, key, tasksUris) {
  const tasksBySuspectUris = groupBy(tasks, key)
  return fillWithEmptyArrays(tasksBySuspectUris, tasksUris)
}

const getKeys = (uris, includeArchived) => {
  const keys = uris.map(buildKey(null))
  if (includeArchived == null) return keys
  const mergedKeys = uris.map(buildKey('merged'))
  const dissmissedKeys = uris.map(buildKey('dismissed'))
  return keys.concat(mergedKeys, dissmissedKeys)
}

const buildKey = state => uri => [ uri, state ]

const fillWithEmptyArrays = (getTasksByUris, uris) => {
  for (const uri of uris) {
    if (getTasksByUris[uri] == null) getTasksByUris[uri] = []
  }
  return getTasksByUris
}

const assignKeyIfExists = (newTask, name, value) => {
  if (value != null) { newTask[name] = value }
}
