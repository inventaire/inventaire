__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
user_ = __.require 'controllers', 'user/lib/user'
notifs_ = __.require 'lib', 'notifications'
promises_ = __.require 'lib', 'promises'

exports.get = (req, res)->
  notifs_.byUserId req.user._id
  .then res.json.bind(res)
  .catch error_.Handler(req, res)

exports.updateStatus = (req, res) ->
  { times } = req.body
  unless _.isArray(times) and times.length > 0
    return _.ok res

  reqUserId = req.user._id

  # could probably be replaced by a batch operation
  promises_.all times.map(notifs_.updateReadStatus.bind(null, reqUserId))
  .then ->
    _.success [reqUserId, times], 'notifs marked as read'
    _.ok res
  .catch error_.Handler(req, res)
