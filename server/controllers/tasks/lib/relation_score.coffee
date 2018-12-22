__ = require('config').universalPath
_ = __.require 'builders', 'utils'
tasks_ = require './tasks'
# relationScore (between 0 & 1) express the number of tasks for the same suspect

module.exports = (suspectUri)->
  tasks_.bySuspectUri suspectUri
  .then (tasks)->
    relationScore = calculateRelationScore tasks
    tasksToUpdate = tasks.filter relationScoreIsntUpToDate(relationScore)
    if tasksToUpdate.length is 0 then return
    tasks_.update
      ids: _.map tasksToUpdate, '_id'
      attribute: 'relationScore'
      newValue: relationScore

calculateRelationScore = (list)->
  score = 1 / list.length
  return _.round score, 2

relationScoreIsntUpToDate = (relationScore)-> (task)-> task.relationScore isnt relationScore
