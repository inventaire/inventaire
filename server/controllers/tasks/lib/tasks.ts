import { groupBy } from 'lodash-es'
import dbFactory from '#db/couchdb/base'
import { mappedArrayPromise } from '#lib/promises'
import { createTaskDoc, updateTaskDoc } from '#models/task'

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
  const tasks = tasksDocs.map(createTaskDoc)
  return db.bulk(tasks)
}

export async function updateTask (options) {
  const { ids, attribute, newValue } = options
  if (ids.length === 0) return []

  return getTasksByIds(ids)
  .then(mappedArrayPromise(task => updateTaskDoc(task, attribute, newValue)))
  .then(db.bulk)
}

export const bulkDeleteTasks = db.bulkDelete

export const getTaskById = db.get

export const getTasksByIds = db.byIds

export function getTasksByScore (options) {
  const { limit, offset } = options
  return db.viewCustom('byScore', {
    limit,
    skip: offset,
    descending: true,
    include_docs: true,
  })
}

export function getTasksByEntitiesType (options) {
  const { type, limit, offset } = options
  return db.viewCustom('byEntitiesType', {
    startkey: type,
    endkey: type,
    limit,
    skip: offset,
    include_docs: true,
  })
}

export function getTasksBySuspectUri (suspectUri, options = {}) {
  return getTasksBySuspectUris([ suspectUri ], options)
}

export function getTasksBySuspectUriAndState (suspectUri, state) {
  return db.viewByKey('bySuspectUriAndState', [ suspectUri, state ])
}

export function getTasksBySuggestionUri (suggestionUri) {
  return db.viewByKey('bySuggestionUriAndState', [ suggestionUri, null ])
}

export async function getTasksBySuspectUris (suspectUris, options = {}) {
  const { index, includeArchived } = options
  const tasks = await db.viewByKeys('bySuspectUriAndState', getKeys(suspectUris, includeArchived))
  if (index !== true) return tasks
  const getTasksBySuspectUris = groupBy(tasks, 'suspectUri')
  return completeWithEmptyArrays(getTasksBySuspectUris, suspectUris)
}

export async function getTasksBySuggestionUris (suggestionUris, options = {}) {
  const { index, includeArchived } = options
  const tasks = await db.viewByKeys('bySuggestionUriAndState', getKeys(suggestionUris, includeArchived))
  if (index !== true) return tasks
  const getTasksBySuggestionUris = groupBy(tasks, 'suggestionUri')
  return completeWithEmptyArrays(getTasksBySuggestionUris, suggestionUris)
}

const getKeys = (uris, includeArchived) => {
  const keys = uris.map(buildKey(null))
  if (includeArchived == null) return keys
  const mergedKeys = uris.map(buildKey('merged'))
  const dissmissedKeys = uris.map(buildKey('dismissed'))
  return keys.concat(mergedKeys, dissmissedKeys)
}

const buildKey = state => uri => [ uri, state ]

const completeWithEmptyArrays = (getTasksByUris, uris) => {
  for (const uri of uris) {
    if (getTasksByUris[uri] == null) getTasksByUris[uri] = []
  }
  return getTasksByUris
}

const assignKeyIfExists = (newTask, name, value) => {
  if (value != null) { newTask[name] = value }
}
