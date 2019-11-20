
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const { possibleActions } = require('./lib/actions_lists')
const groups_ = require('./lib/groups')
const rightsVerification = require('./lib/rights_verification')
const { Track } = __.require('lib', 'track')

// Actions:
// - invite
// - accept
// - decline
// - request
// - cancel-request
// - accept-request
// - refuse-request
// - make-admin
// - kick
// - leave
// - update-settings

module.exports = (req, res) => {
  if (req.user == null) return error_.unauthorizedApiAccess(req, res)
  // Allow to pass the action in either the query or the body, as ActionsControllers
  let action = req.body.action || req.query.action

  // don't convert an undefined action to an empty string
  // it makes debugging confusing
  if (action != null) {
    action = _.camelCase(action)
  }

  if (!possibleActions.includes(action)) {
    return error_.unknownAction(req, res, action)
  }

  return handleAction(action, req, res)
}

const handleAction = (action, req, res) => {
  const { body } = req
  // user is needed for invite, acceptRequest, refuseRequest controllers only
  const { group: groupId, user: userId } = body
  const reqUserId = req.user._id

  _.log([ reqUserId, body ], 'group action')

  if ((userId != null) && !_.isUserId(userId)) {
    return error_.bundleInvalid(req, res, 'user', userId)
  }

  if ((groupId != null) && !_.isGroupId(groupId)) {
    return error_.bundleInvalid(req, res, 'group', groupId)
  }

  return rightsVerification[action](reqUserId, groupId, userId)
  .then(groups_[action].bind(null, body, reqUserId))
  // Allow to pass an update object, with key/values to be updated on the model
  // as the results of update hooks
  .then(addUpdateData(res))
  .then(Track(req, [ 'groups', action ]))
  .catch(error_.Handler(req, res))
}

const addUpdateData = res => (data = {}) => res.json({ ok: true, update: data.update })
