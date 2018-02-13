__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
{ Track } = __.require 'lib', 'track'

tasks_ = require './lib/tasks'

module.exports = (req, res)->
  { id } = req.query

  tasks_.byId(id)
  .then (task)-> calculateRelationScore(task)
  .then (score)->
    tasks_.update
      taskId: id
      attribute: 'relationScore'
      newValue: score
    .then res.json.bind(res)
    .tap Track(req, ['task', 'update relation score'])
    .catch error_.Handler(req, res)

calculateRelationScore = (task)->
  tasksBySuspect(task.suspectUri)
  .then (tasks)->
    1 / tasks.length

tasksBySuspect = (suspectUri)->
  tasks_.bySuspectUri(suspectUri)
