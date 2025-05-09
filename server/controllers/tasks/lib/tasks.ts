import { groupBy, uniq } from 'lodash-es'
import { dbFactory } from '#db/couchdb/base'
import { isEntityUri } from '#lib/boolean_validations'
import { maxKey, minKey } from '#lib/couch'
import { mappedArrayPromise } from '#lib/promises'
import { combinations } from '#lib/utils/base'
import { createTaskDoc, updateTaskDoc } from '#models/task'
import type { EntityUri, EntityType, Claims } from '#types/entity'
import type { Task, TaskState, TaskType, Suggestion } from '#types/task'

const db = await dbFactory('tasks')

export async function createTasksFromSuggestions ({ suspectUri, type, entitiesType, suggestions }: { suspectUri: EntityUri, type: TaskType, entitiesType: EntityType, suggestions: Suggestion[] }) {
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

export async function updateTasks ({ ids, attribute, newValue }) {
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
  // Only tasks with a key `reporter` will be requested.
  // To query tasks without, see getTasksByScore
  const { type, entitiesType, limit, offset } = options
  return db.getDocsByViewQuery<Task>('byTypeAndEntitiesType', {
    startkey: [ type, entitiesType ],
    endkey: [ type, entitiesType ],
    limit,
    skip: offset,
    include_docs: true,
    reduce: false,
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

export async function getTasksBySuspectUrisAndType (uris: EntityUri[], types: string[]) {
  const keys = combinations(uris, types)
  const tasks = await db.getDocsByViewKeys<Task>('bySuspectUriAndType', keys)
  return indexByTasksKey(tasks, 'suspectUri', uris)
}

export async function getTasksBySuspectUris (uris: EntityUri[], options: TasksQueryOptions = {}) {
  const { index, includeArchived } = options
  const tasks = await db.getDocsByViewKeys<Task>('bySuspectUriAndState', getKeys(uris, includeArchived))
  if (index !== true) return tasks || []
  return indexByTasksKey(tasks, 'suspectUri', uris)
}

export function getExistingTasks (uri: EntityUri) {
  return getTasksBySuspectUris([ uri ])
}

export async function getTasksBySuggestionUris (uris: EntityUri[], options: TasksQueryOptions = {}) {
  const { index, includeArchived } = options
  const tasks = await db.getDocsByViewKeys<Task>('bySuggestionUriAndState', getKeys(uris, includeArchived))
  if (index !== true) return tasks
  return indexByTasksKey(tasks, 'suggestionUri', uris)
}

export function getClaimsValuesUris (claims: Claims) {
  // This should still work after adding new relation properties
  const uris = Object.values(claims)
    .flat()
    .filter(value => isEntityUri(value))
  return uniq(uris)
}

function indexByTasksKey (tasks, key, tasksUris) {
  const tasksBySuspectUris = groupBy(tasks, key)
  return fillWithEmptyArrays(tasksBySuspectUris, tasksUris)
}

function getKeys (uris: EntityUri[], includeArchived?: boolean) {
  const keys = uris.map(buildKey(null))
  if (includeArchived == null) return keys
  const processedKeys = uris.map(buildKey('processed'))
  const dissmissedKeys = uris.map(buildKey('dismissed'))
  return keys.concat(processedKeys, dissmissedKeys)
}

const buildKey = state => uri => [ uri, state ]

function fillWithEmptyArrays (getTasksByUris, uris: EntityUri[]) {
  for (const uri of uris) {
    if (getTasksByUris[uri] == null) getTasksByUris[uri] = []
  }
  return getTasksByUris
}

function assignKeyIfExists (newTask, name, value) {
  if (value != null) { newTask[name] = value }
}

export async function getTasksCount () {
  const { rows } = await db.view('tasks', 'byTypeAndEntitiesType', {
    startkey: [ minKey, minKey ],
    endkey: [ maxKey, maxKey ],
    group: true,
    group_level: 2,
  })
  return transformToObject(rows)
}

function transformToObject (rows) {
  const tasksCountByTypeAndEntitiesType = {}
  rows.forEach(row => {
    const [ type, entitiesType ] = row.key
    if (!tasksCountByTypeAndEntitiesType[type]) {
      tasksCountByTypeAndEntitiesType[type] = {}
    }
    tasksCountByTypeAndEntitiesType[type][entitiesType] = row.value
  })
  return tasksCountByTypeAndEntitiesType
}
