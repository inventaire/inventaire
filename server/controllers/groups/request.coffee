CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
groups_ = require './lib/groups'
user_ = __.require 'lib', 'user/user'
tests = __.require 'models','tests/common-tests'

module.exports = (req, res)->
  { group } = req.body
  userId = req.user._id

  unless tests.valid 'userId', userId
    return error_.bundle res, "invalid userId", 400, userId

  unless tests.valid 'groupId', group
    return error_.bundle res, "invalid groupId", 400, group

  verifyRightsToRequest userId, group
  .then groups_.request.bind(groups_, group, userId)
  .then _.Ok(res)
  .catch error_.Handler(res)


verifyRightsToRequest = (userId, groupId)->
  groups_.userInGroupOrInvited userId, groupId
  .then (bool)->
    if bool
      throw error_.new "user is already in group", 403, userId, groupId
