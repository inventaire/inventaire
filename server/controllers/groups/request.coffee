CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
groups_ = require './lib/groups'
tests = __.require 'models','tests/common-tests'
rightsVerification = require './lib/rights_verification'

commonHandler = (action, req, res)->
  { group } = req.body
  userId = req.user._id

  unless tests.valid 'userId', userId
    return error_.bundle res, "invalid userId", 400, userId

  unless tests.valid 'groupId', group
    return error_.bundle res, "invalid groupId", 400, group

  rightsVerification[action](userId, group)
  .then groups_[action].bind(null, group, userId)
  .then _.Ok(res)
  .catch error_.Handler(res)



module.exports =
  request: commonHandler.bind(null, 'request')
  cancelRequest: commonHandler.bind(null, 'cancelRequest')
