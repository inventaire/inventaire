const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = require('builders/utils')
const promises_ = require('lib/promises')
const Task = require('models/task')

const db = require('db/couchdb/base')('tasks')

const tasks_ = module.exports = {
  create: async (suspectUri, type, entitiesType, suggestions) => {
    // suggestions may only be an array of objects with a 'uri' key
    const newTasksObjects = suggestions.map(suggestion => {
      const { _score, uri: suggestionUri, occurrences, reporter, clue } = suggestion

      const newTask = { type, suspectUri, suggestionUri }

      assignKeyIfExists(newTask, 'entitiesType', entitiesType)
      assignKeyIfExists(newTask, 'lexicalScore', _score)
      assignKeyIfExists(newTask, 'reporter', reporter)
      assignKeyIfExists(newTask, 'externalSourcesOccurrences', occurrences)
      assignKeyIfExists(newTask, 'clue', clue)
      return newTask
    })
    return tasks_.createInBulk(newTasksObjects)
  },

  createInBulk: async tasksDocs => {
    const tasks = tasksDocs.map(Task.create)
    return db.bulk(tasks)
  },

  update: async options => {
    const { ids, attribute, newValue } = options
    if (ids.length === 0) return []

    return tasks_.byIds(ids)
    .then(promises_.map(task => Task.update(task, attribute, newValue)))
    .then(db.bulk)
  },

  bulkDelete: db.bulkDelete,

  byId: db.get,

  byIds: db.byIds,

  byScore: options => {
    const { limit, offset } = options
    return db.viewCustom('byScore', {
      limit,
      skip: offset,
      descending: true,
      include_docs: true
    })
  },

  byEntitiesType: options => {
    const { type, limit, offset } = options
    return db.viewCustom('byEntitiesType', {
      startkey: type,
      endkey: type,
      limit,
      skip: offset,
      include_docs: true
    })
  },

  bySuspectUri: (suspectUri, options) => {
    return tasks_.bySuspectUris([ suspectUri ], options)
  },

  bySuspectUriAndState: (suspectUri, state) => {
    return db.viewByKey('bySuspectUriAndState', [ suspectUri, state ])
  },

  bySuggestionUri: suggestionUri => {
    return db.viewByKey('bySuggestionUriAndState', [ suggestionUri, null ])
  },

  bySuspectUris: (suspectUris, options = {}) => {
    const { index, includeArchived } = options
    return db.viewByKeys('bySuspectUriAndState', getKeys(suspectUris, includeArchived))
    .then(tasks => {
      if (index !== true) return tasks
      const tasksBySuspectUris = _.groupBy(tasks, 'suspectUri')
      return completeWithEmptyArrays(tasksBySuspectUris, suspectUris)
    })
  },

  bySuggestionUris: (suggestionUris, options = {}) => {
    const { index, includeArchived } = options
    return db.viewByKeys('bySuggestionUriAndState', getKeys(suggestionUris, includeArchived))
    .then(tasks => {
      if (index !== true) return tasks
      const tasksBySuggestionUris = _.groupBy(tasks, 'suggestionUri')
      return completeWithEmptyArrays(tasksBySuggestionUris, suggestionUris)
    })
  }
}

const getKeys = (uris, includeArchived) => {
  const keys = uris.map(buildKey(null))
  if (includeArchived == null) return keys
  const mergedKeys = uris.map(buildKey('merged'))
  const dissmissedKeys = uris.map(buildKey('dismissed'))
  return keys.concat(mergedKeys, dissmissedKeys)
}

const buildKey = state => uri => [ uri, state ]

const completeWithEmptyArrays = (tasksByUris, uris) => {
  for (const uri of uris) {
    if (tasksByUris[uri] == null) tasksByUris[uri] = []
  }
  return tasksByUris
}

const assignKeyIfExists = (newTask, name, value) => {
  if (value != null) { newTask[name] = value }
}
