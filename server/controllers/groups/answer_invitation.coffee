CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
groups_ = require './lib/groups'
tests = __.require 'models','tests/common-tests'

module.exports =
  accept: (req, res)-> answer req, res, 'accept'
  decline: (req, res)-> answer req, res, 'decline'

answer = (req, res, action)->
  groupId = req.body.group
  unless tests.valid 'groupId', groupId
    return error_.bundle res, 'invalid groupId', 400, groupId

  userId = req.user._id

  groups_.userInvited userId, groupId
  .then groups_.answerInvitation.bind(null, userId, groupId, action)
  .then _.Ok(res)
  .catch error_.Handler(res)
