CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
groups_ = require './lib/groups'
tests = __.require 'models','tests/common'
rightsVerification = require './lib/rights_verification'
{ Track } = __.require 'lib', 'track'

module.exports = (action, req, res)->
  { body } = req
  # user is needed for invite, acceptRequest, refuseRequest controllers only
  { group, user } = body
  reqUserId = req.user._id

  _.log [ reqUserId, body ], 'group action'

  if user? and not tests.valid 'userId', user
    return error_.bundleInvalid req, res, 'user', user

  unless tests.valid 'groupId', group
    return error_.bundleInvalid req, res, 'group', group

  rightsVerification[action](reqUserId, group, user)
  .then groups_[action].bind(null, body, reqUserId)
  # Allow to pass an update object, with key/values to be updated on the model
  # as the results of update hooks
  .then addUpdateData(res)
  .then Track(req, ['groups', action])
  .catch error_.Handler(req, res)

addUpdateData = (res)-> (data={})-> res.json { ok: true, update: data.update }
