__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ publicUsersData } = __.require 'controllers', 'user/lib/public_user_data'
parseBbox = __.require 'lib', 'parse_bbox'
user_ = __.require 'controllers', 'user/lib/user'
error_ = __.require 'lib', 'error/error'

module.exports = (req, res) ->
  { query } = req
  parseBbox query
  .then user_.byPosition
  .then publicUsersData
  .then _.Wrap(res, 'users')
  .catch error_.Handler(req, res)
