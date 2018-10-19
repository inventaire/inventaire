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
    db.viewByKey 'bySuspectUri', suspectUri

  bySuspectUris: (suspectUris, index)->
    db.viewByKeys 'bySuspectUri', suspectUris
    .then (tasks)->
      if index isnt true then return tasks
      return tasks.reduce regroup.bySuspectUris, getIndexBase(suspectUris)

  bySuggestionUris: (suggestionUri, index)->
    db.viewByKeys 'bySuggestionUri', suggestionUri
    .then (tasks)->
      if index isnt true then return tasks
      return tasks.reduce regroup.bySuggestionUris, getIndexBase(suggestionUri)

regroupBy = (uriName)-> (tasks, task)->
  tasks[task[uriName]].push task
  return tasks

regroup =
  bySuspectUris: regroupBy 'suspectUri'
  bySuggestionUris: regroupBy 'suggestionUri'

getIndexBase = (uris)-> index = uris.reduce buildIndex, {}
buildIndex = (index, uri)->
  index[uri] = []
  return index
