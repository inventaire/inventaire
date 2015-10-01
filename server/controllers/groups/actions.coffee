CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
groups_ = require './lib/groups'
tests = __.require 'models','tests/common-tests'
rightsVerification = require './lib/rights_verification'

memberActions = [ 'invite', 'accept', 'decline', 'request', 'cancelRequest', 'acceptRequest', 'refuseRequest' ]
adminActions = [ 'updateSettings' ]

module.exports =
  possibleActions: memberActions.concat adminActions

  handleAction: (action, req, res)->
    { body } = req
    # user is needed for invite, acceptRequest, refuseRequest controllers only
    { group, user } = body
    userId = req.user._id

    if user? and not tests.valid 'userId', user
      return error_.bundle res, "invalid userId", 400, user

    unless tests.valid 'groupId', group
      return error_.bundle res, "invalid groupId", 400, group

    rightsVerification[action](userId, group, user)
    .then groups_[action].bind(null, body)
    .then _.Ok(res)
    .catch error_.Handler(res)
