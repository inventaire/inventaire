import { groupBy } from 'lodash-es'
import dbFactory from '#db/couchdb/base'
import { mappedArrayPromise } from '#lib/promises'
import { createTaskDoc, updateTaskDoc } from '#models/task'
import type { EntityType, EntityUri } from '#types/entity'
import type { Task, TaskState, TaskType } from '#types/task'

const db = await dbFactory('tasks')

export async function createTasksFromSuggestions ({ suspectUri, type, entitiesType, suggestions }: { suspectUri: EntityUri, type: TaskType, entitiesType: EntityType, suggestions }) {
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

export const getTaskById = db.get<Task>

export const getTasksByIds = db.byIds<Task>

export function getTasksByScore (options) {
  const { limit, offset } = options
  return db.getDocsByViewQuery<Task>('byScore', {
    limit,
    skip: offset,
    descending: true,
    include_docs: true,
  })
}

export function getTasksByEntitiesType (options) {
  const { type, entitiesType, limit, offset } = options
  return db.getDocsByViewQuery<Task>('byTypeAndEntitiesType', {
    startkey: [ type, entitiesType ],
    endkey: [ type, entitiesType ],
    limit,
    skip: offset,
    include_docs: true,
  })
}

interface TasksQueryOptions {
  index?: boolean
  includeArchived?: boolean
}

export function getTasksBySuspectUri (suspectUri: EntityUri, options: TasksQueryOptions = {}) {
  return getTasksBySuspectUris([ suspectUri ], options)
}

export function getTasksBySuspectUriAndState (suspectUri: EntityUri, state: TaskState) {
  return db.getDocsByViewKey<Task>('bySuspectUriAndState', [ suspectUri, state ])
}

export function getTasksBySuggestionUri (suggestionUri) {
  return db.getDocsByViewKey<Task>('bySuggestionUriAndState', [ suggestionUri, null ])
}

export async function getTasksBySuspectUris (suspectUris: EntityUri[], options: TasksQueryOptions = {}) {
  const { index, includeArchived } = options
  const tasks = await db.getDocsByViewKeys<Task>('bySuspectUriAndState', getKeys(suspectUris, includeArchived))
  if (index !== true) return tasks
  const getTasksBySuspectUris = groupBy(tasks, 'suspectUri')
  return completeWithEmptyArrays(getTasksBySuspectUris, suspectUris)
}

export async function getTasksBySuggestionUris (suggestionUris: EntityUri[], options: TasksQueryOptions = {}) {
  const { index, includeArchived } = options
  const tasks = await db.getDocsByViewKeys<Task>('bySuggestionUriAndState', getKeys(suggestionUris, includeArchived))
  if (index !== true) return tasks
  const getTasksBySuggestionUris = groupBy(tasks, 'suggestionUri')
  return completeWithEmptyArrays(getTasksBySuggestionUris, suggestionUris)
}

function getKeys (uris: EntityUri[], includeArchived?: boolean) {
  const keys = uris.map(buildKey(null))
  if (includeArchived == null) return keys
  const mergedKeys = uris.map(buildKey('merged'))
  const dissmissedKeys = uris.map(buildKey('dismissed'))
  return keys.concat(mergedKeys, dissmissedKeys)
}

const buildKey = state => uri => [ uri, state ]

function completeWithEmptyArrays (getTasksByUris, uris: EntityUri[]) {
  for (const uri of uris) {
    if (getTasksByUris[uri] == null) getTasksByUris[uri] = []
  }
  return getTasksByUris
}

function assignKeyIfExists (newTask, name, value) {
  if (value != null) { newTask[name] = value }
}
