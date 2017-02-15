CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
groups_ = require './lib/groups'
tests = __.require 'models','tests/common-tests'
rightsVerification = require './lib/rights_verification'
{ Track } = __.require 'lib', 'track'

module.exports = (action, req, res)->
  { body } = req
  # user is needed for invite, acceptRequest, refuseRequest controllers only
  { group, user } = body
  reqUserId = req.user._id

  _.log [reqUserId, body], 'group action'

  if user? and not tests.valid 'userId', user
    return error_.bundle req, res, 'invalid user id', 400, user

  unless tests.valid 'groupId', group
    return error_.bundle req, res, 'invalid group id', 400, group

  rightsVerification[action](reqUserId, group, user)
  .then groups_[action].bind(null, body, reqUserId)
  .then _.Ok(res)
  .then Track(req, ['groups', action])
  .catch error_.Handler(req, res)
