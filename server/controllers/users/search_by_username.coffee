__ = require('config').universalPath
_ = __.require 'builders', 'utils'
user_ = __.require 'controllers', 'user/lib/user'
error_ = __.require 'lib', 'error/error'

module.exports = (req, res) ->
  { query } = req
  search = query.search?.trim()
  reqUserId = req.user?._id

  unless _.isNonEmptyString search
    return error_.bundle req, res, 'invalid search', 400, query

  user_.getUsersAuthorizedData user_.usernameStartBy(search), reqUserId
  .then _.Wrap(res, 'users')
  .catch error_.Handler(req, res)
