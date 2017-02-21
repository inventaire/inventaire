__ = require('config').universalPath
_ = __.require 'builders', 'utils'
user_ = __.require 'controllers', 'user/lib/user'
error_ = __.require 'lib', 'error/error'
{ publicUsersData } = __.require 'controllers', 'user/lib/public_user_data'

module.exports = (req, res) ->
  { query } = req
  { search } = query
  unless search?
    return error_.bundle req, res, 'bad query', 400, query

  user_.usernameStartBy search
  .then publicUsersData
  .then _.Wrap(res, 'users')
  .catch error_.Handler(req, res)
