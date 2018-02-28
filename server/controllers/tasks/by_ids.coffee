__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
tasks_ = __.require 'controllers', 'tasks/lib/tasks'

module.exports = (req, res)->
  { ids } = req.query

  ids = ids.split '|'
  _.log ids, 'ids'

  tasks_.byIds ids
  .then _.Wrap(res, 'tasks')
  .catch error_.Handler(req, res)
