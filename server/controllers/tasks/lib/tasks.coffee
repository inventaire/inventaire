CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
Task = __.require 'models', 'task'

db = __.require('couch', 'base')('tasks')

module.exports = tasks_ =
  byScore: (limit)->
    db.viewCustom 'byScore',
      limit: limit
      descending: true
      include_docs: true

  create: (taskDoc)->
    promises_.try -> Task.create taskDoc
    .then db.postAndReturn
    .then _.Log('task created')

  bySuspectUri: (suspectUri)->
    db.viewByKey 'bySuspectUri', suspectUri

  bySuspectUris: (suspectUris)->
    db.viewByKeys 'bySuspectUri', suspectUris

  keepNewTasks: (newTasks)->
    suspectUris = _.pluck newTasks, 'suspectUri'

    tasks_.bySuspectUris suspectUris
    .then (existingTasks)->
      suggestionBySuspect = existingTasks.reduce indexSuggestionBySuspect, {}
      return newTasks.filter keepNewTask(suggestionBySuspect)

keepNewTask = (suggestionBySuspect)-> (newTask)->
  matchingExistingTasksUris = suggestionBySuspect[newTask.suspectUri]
  unless matchingExistingTasksUris? then return true
  return newTask.suggestionUri not in matchingExistingTasksUris

indexSuggestionBySuspect = (index, task)->
  index[task.suspectUri] or= []
  index[task.suspectUri].push task.suggestionUri
  return index
