__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
{ Track } = __.require 'lib', 'track'
tasks_ = __.require 'controllers', 'tasks/lib/tasks'

promises_ = __.require 'lib', 'promises'

module.exports = (req, res, next)->
  { id, attribute, value } = req.body
  _.log id, 'update task'

  unless _.isNonEmptyString(id)
    return error_.bundleMissingBody req, res, 'task'

  ids = [ id ]

  tasks_.update
    ids: ids
    attribute: attribute
    newValue: value
  .then res.json.bind(res)
  .tap Track(req, ['task', 'update'])
  .catch error_.Handler(req, res)
