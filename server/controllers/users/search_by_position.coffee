__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ publicUsersData } = __.require 'lib', 'user/public_user_data'
parseBbox = __.require 'lib', 'parse_bbox'
user_ = __.require 'lib', 'user/user'
error_ = __.require 'lib', 'error/error'

module.exports = (res, query) ->
  parseBbox query
  .then user_.byPosition
  .then publicUsersData
  .then _.Wrap(res, 'users')
  .catch error_.Handler(res)
