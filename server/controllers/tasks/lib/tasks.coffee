CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
Task = __.require 'models', 'task'

db = __.require('couch', 'base')('tasks')

module.exports = tasks_ =
  create: (taskDoc)->
    promises_.try -> Task.create taskDoc
    .then db.postAndReturn
    .then _.Log('task created')

  update: (options)->
    { ids, attribute, newValue } = options
    tasks_.byIds ids
    .map (task)-> Task.update task, attribute, newValue
    .then db.bulk
    .then _.Log('tasks updated')

  byId: db.get

  byIds: db.fetch

  byScore: (options)->
    { limit, offset } = options
    db.viewCustom 'byScore',
      limit: limit
      skip: offset
      descending: true
      include_docs: true

  bySuspectUri: (suspectUri)->
    db.viewByKey 'bySuspectUriAndState', [ suspectUri, null ]

  bySuspectUris: (suspectUris, options = {})->
    { index, includeArchived } = options
    db.viewByKeys 'bySuspectUriAndState', getKeys(suspectUris, options)
    .then (tasks)->
      if index isnt true then return tasks
      tasksBySuspectUris = _.groupBy tasks, 'suspectUri'
      return completeWithEmptyArrays tasksBySuspectUris, suspectUris

  bySuggestionUris: (suggestionUris, options = {})->
    { index, includeArchived } = options
    db.viewByKeys 'bySuggestionUriAndState', getKeys(suggestionUris, options)
    .then (tasks)->
      if index isnt true then return tasks
      tasksBySuggestionUris = _.groupBy tasks, 'suggestionUri'
      return completeWithEmptyArrays tasksBySuggestionUris, suggestionUris

getKeys = (uris, includeArchived)->
  keys = uris.map buildKey(null)
  unless includeArchived? then return keys
  mergedKeys = uris.map buildKey('merged')
  dissmissedKeys = uris.map buildKey('dismissed')
  return keys.concat mergedKeys, dissmissedKeys

buildKey = (state)-> (uri)-> [ uri, state ]

completeWithEmptyArrays = (tasksByUris, uris)->
  for uri in uris
    tasksByUris[uri] ?= []
  return tasksByUris
