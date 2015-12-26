__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ publicUsersData } = __.require 'lib', 'user/public_user_data'
SendUsersData = require './lib/send_users_data'
parseLatLng = __.require 'lib', 'parse_lat_lng'
user_ = __.require 'lib', 'user/user'
error_ = __.require 'lib', 'error/error'

module.exports = (res, query) ->
  parseLatLng query
  .then user_.byPosition
  .then publicUsersData
  .then SendUsersData(res)
  .catch error_.Handler(res)
