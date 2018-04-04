__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
tasks_ = __.require 'controllers', 'tasks/lib/tasks'

module.exports = (req, res)->
  { ids } = req.query

  unless _.isNonEmptyString ids
    return error_.bundleMissingQuery req, res, 'ids'

  ids = ids.split '|'

  tasks_.byIds ids
  .then _.Wrap(res, 'tasks')
  .catch error_.Handler(req, res)
