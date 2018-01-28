__ = require('config').universalPath
_ = __.require 'builders', 'utils'
tasks_ = __.require 'controllers', 'tasks/lib/tasks'
error_ = __.require 'lib', 'error/error'
{ Track } = __.require 'lib', 'track'

module.exports = (req, res, next)->
  { tasks } = req.body
  _.log tasks, 'create tasks'

  unless _.isNonEmptyArray tasks
    return error_.bundleMissingBody req, res, 'tasks'

  validateTasksUniqueness tasks
  .then -> Promise.all tasks.map tasks_.create
  .then _.Wrap(res, 'tasks')
  .then Track(req, [ 'tasks', 'create', null, tasks ])
  .catch error_.Handler(req, res)

validateTasksUniqueness = (tasks)->
  tasks_.keepNewTasks tasks
  .then (tasksToCreate)->
    if tasksToCreate.length isnt tasks.length
      throw error_.new 'one or several tasks already created', 400, tasks
