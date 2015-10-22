__ = require('config').root
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user/user'
error_ = __.require 'lib', 'error/error'
sendUsersData = require './lib/send_users_data'


module.exports = (req, res, next) ->
  { query } = req
  { action, search } = query
  if action?
    switch action
      when 'search' then searchByUsername res, search
      else error_.unknownAction res

searchByUsername = (res, search) ->
  unless search?
    return error_.bundle res, 'bad query', 400, query

  user_.usernameStartBy search
  .then user_.publicUsersData.bind(user_)
  .then sendUsersData.bind(null, res)
  .catch error_.Handler(res)
