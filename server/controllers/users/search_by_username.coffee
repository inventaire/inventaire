__ = require('config').universalPath
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user/user'
error_ = __.require 'lib', 'error/error'
{ publicUsersData } = __.require 'lib', 'user/public_user_data'

module.exports = (res, query) ->
  { search } = query
  unless search?
    return error_.bundle res, 'bad query', 400, query

  user_.usernameStartBy search
  .then publicUsersData
  .then _.Wrap(res, 'users')
  .catch error_.Handler(res)
