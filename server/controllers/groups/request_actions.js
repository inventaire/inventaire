const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const sanitize = __.require('lib', 'sanitize/sanitize')
const groups_ = require('./lib/groups')
const membershipActions = require('./lib/membership_actions')
const { Track } = __.require('lib', 'track')
const error_ = __.require('lib', 'error/error')
const promises_ = __.require('lib', 'promises')

module.exports = action => (req, res) => {
  sanitize(req, res, { group: {}, user: {} })
  .then(params => {
    const { group: groupId, user: userId, reqUserId } = params
    _.log(params, `${action} request group`)

    return validateRequestRights(reqUserId, groupId, userId)
    .then(membershipActions[`${action}Request`].bind(null, params, reqUserId))
    .then(addUpdateData(res))
    .then(Track(req, [ 'groups', `${action} request` ]))
  })
  .catch(error_.Handler(req, res))
}

// Allow to pass an update object, with key/values to be updated on the model
// as the results of update hooks
const addUpdateData = res => (data = {}) => {
  res.json({ ok: true, update: data.update })
}

const validateRequestRights = (reqUserId, groupId, requesterId) => {
  return promises_.all([
    groups_.userInAdmins(reqUserId, groupId),
    groups_.userInRequested(requesterId, groupId)
  ])
  .spread((userInAdmins, requesterInRequested) => {
    if (!userInAdmins) {
      throw error_.new('user is not admin', 403, reqUserId, groupId)
    }
    if (!requesterInRequested) {
      throw error_.new('request not found', 401, requesterId, groupId)
    }
  })
}
