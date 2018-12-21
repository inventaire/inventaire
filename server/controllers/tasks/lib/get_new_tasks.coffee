module.exports = (tasksCandidates, existingTasks)->
  suggestionBySuspect = existingTasks.reduce indexSuggestionBySuspect, {}
  return tasksCandidates.filter isNewTask(suggestionBySuspect)

isNewTask = (suggestionBySuspect)-> (newTask)->
  matchingExistingTasksUris = suggestionBySuspect[newTask.suspectUri]
  unless matchingExistingTasksUris? then return true
  return newTask.suggestionUri not in matchingExistingTasksUris

indexSuggestionBySuspect = (index, task)->
  index[task.suspectUri] or= []
  index[task.suspectUri].push task.suggestionUri
  return index
