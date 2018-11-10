CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
tasks_ = __.require 'controllers', 'tasks/lib/tasks'

module.exports = (tasks)->
  suspectUris = _.uniq _.pluck(tasks, 'suspectUri')
  tasks_.bySuspectUris suspectUris
  .then (existingTasks)->
    suggestionBySuspect = existingTasks.reduce indexSuggestionBySuspect, {}
    tasks.filter isNewTask(suggestionBySuspect)

isNewTask = (suggestionBySuspect)-> (newTask)->
  matchingExistingTasksUris = suggestionBySuspect[newTask.suspectUri]
  unless matchingExistingTasksUris? then return true
  return newTask.suggestionUri not in matchingExistingTasksUris

indexSuggestionBySuspect = (index, task)->
  index[task.suspectUri] or= []
  index[task.suspectUri].push task.suggestionUri
  return index
