__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
user_ = __.require 'controllers', 'user/lib/user'
error_ = __.require 'lib', 'error/error'
sanitize = __.require 'lib', 'sanitize/sanitize'
responses_ = __.require 'lib', 'responses'

sanitization =
  range: {}

module.exports = (req, res)->
  reqUserId = req.user?._id
  sanitize req, res, sanitization
  .then (input)-> user_.nearby reqUserId, input.range
  .then (usersIds)-> user_.getUsersByIds usersIds, reqUserId
  .then responses_.Wrap(res, 'users')
  .catch error_.Handler(req, res)
