__ = require('config').universalPath
_ = __.require 'builders', 'utils'

tasks_ = require './tasks'

calculateRelationScore = (tasks)->
  1 / tasks.length

module.exports =
  calculateRelationScore: calculateRelationScore
  updateRelationScore: (taskDoc)->
    tasks_.bySuspectUri(task.suspectUri)
    .then -> calculateRelationScore
    .then (score)->
      tasks_.update
        taskId: taskDoc._id
        attribute: 'relationScore'
        newValue: score
