__ = require('config').universalPath
_ = __.require 'builders', 'utils'
tasks_ = __.require 'controllers', 'tasks/lib/tasks'
error_ = __.require 'lib', 'error/error'
{ Track } = __.require 'lib', 'track'

module.exports = (req, res, next)->
  task = req.body
  _.log task, 'create tasks'

  tasks_.create task
  .then res.json.bind(res)
  .then Track(req, [ 'task', 'creation', null, task ])
  .catch error_.Handler(req, res)
