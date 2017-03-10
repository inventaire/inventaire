__ = require('config').universalPath
_ = __.require 'builders', 'utils'
user_ = __.require 'controllers', 'user/lib/user'
error_ = __.require 'lib', 'error/error'

module.exports = (reqUserId, range='50')->
  try range = _.stringToInt range
  catch err then return error_.rejectInvalid 'range', range

  return user_.nearby reqUserId, range
