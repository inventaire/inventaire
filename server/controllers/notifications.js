__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
responses_ = __.require 'lib', 'responses'
user_ = __.require 'controllers', 'user/lib/user'
notifs_ = __.require 'lib', 'notifications'
promises_ = __.require 'lib', 'promises'

get = (req, res)->
  unless req.user? then return error_.unauthorizedApiAccess req, res

  notifs_.byUserId req.user._id
  .then responses_.Wrap(res, 'notifications')
  .catch error_.Handler(req, res)

updateStatus = (req, res)->
  unless req.user? then return error_.unauthorizedApiAccess req, res
  reqUserId = req.user._id

  { times } = req.body
  unless _.isArray(times) and times.length > 0 then return _.ok res

  # could probably be replaced by a batch operation
  promises_.all times.map(notifs_.updateReadStatus.bind(null, reqUserId))
  .then ->
    _.success [ reqUserId, times ], 'notifs marked as read'
    responses_.ok res
  .catch error_.Handler(req, res)

module.exports = { get, post: updateStatus }
