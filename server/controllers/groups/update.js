CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
{ possibleActions } = require './lib/actions_lists'
groups_ = require './lib/groups'
rightsVerification = require './lib/rights_verification'
{ Track } = __.require 'lib', 'track'

# Actions:
# - invite
# - accept
# - decline
# - request
# - cancel-request
# - accept-request
# - refuse-request
# - make-admin
# - kick
# - leave
# - update-settings

module.exports = (req, res)->
  unless req.user? then return error_.unauthorizedApiAccess req, res
  # Allow to pass the action in either the query or the body, as ActionsControllers
  action = req.body.action or req.query.action

  # don't convert an undefined action to an empty string
  # it makes debugging confusing
  if action?
    action = _.camelCase action

  unless action in possibleActions
    return error_.unknownAction req, res, action

  handleAction action, req, res

handleAction = (action, req, res)->
  { body } = req
  # user is needed for invite, acceptRequest, refuseRequest controllers only
  { group:groupId, user:userId } = body
  reqUserId = req.user._id

  _.log [ reqUserId, body ], 'group action'

  if userId? and not _.isUserId userId
    return error_.bundleInvalid req, res, 'user', userId

  if groupId? and not _.isGroupId groupId
    return error_.bundleInvalid req, res, 'group', groupId

  rightsVerification[action](reqUserId, groupId, userId)
  .then groups_[action].bind(null, body, reqUserId)
  # Allow to pass an update object, with key/values to be updated on the model
  # as the results of update hooks
  .then addUpdateData(res)
  .then Track(req, ['groups', action])
  .catch error_.Handler(req, res)

addUpdateData = (res)-> (data = {})-> res.json { ok: true, update: data.update }
