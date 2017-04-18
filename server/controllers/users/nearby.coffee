__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
user_ = __.require 'controllers', 'user/lib/user'
error_ = __.require 'lib', 'error/error'
getUsersNearby = __.require 'controllers', 'users/lib/get_users_nearby'

module.exports = (req, res)->
  reqUserId = req.user?._id
  { range } = req.query

  getUsersNearby reqUserId, range
  .then user_.getUsersByIds.bind(null, reqUserId)
  .then _.Wrap(res, 'users')
  .catch error_.Handler(req, res)
