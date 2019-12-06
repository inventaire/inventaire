const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const sanitize = __.require('lib', 'sanitize/sanitize')
const groups_ = require('./lib/groups')
const modelAction = require('./lib/model_action')
const { Track } = __.require('lib', 'track')
const error_ = __.require('lib', 'error/error')
const promises_ = __.require('lib', 'promises')

const sanitization = {
  group: {},
  user: { optional: true }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { group: groupId, user: userId, reqUserId } = params
    _.log(params, 'kick request group')

    return validateAdminRightsWithoutAdminsConflict(reqUserId, groupId, userId)
    .then(modelAction('kick').bind(null, params, reqUserId))
    .then(addUpdateData(res))
    .then(Track(req, [ 'groups', 'kick request' ]))
  })
  .catch(error_.Handler(req, res))
}

// Allow to pass an update object, with key/values to be updated on the model
// as the results of update hooks
const addUpdateData = res => (data = {}) => {
  res.json({ ok: true, update: data.update })
}

const validateAdminRightsWithoutAdminsConflict = (reqUserId, groupId, targetId) => {
  return promises_.all([
    groups_.userInAdmins(reqUserId, groupId),
    groups_.userInAdmins(targetId, groupId)
  ])
  .spread((userIsAdmin, targetIsAdmin) => {
    if (!userIsAdmin) {
      throw error_.new('user isnt a group admin', 403, reqUserId, groupId)
    }
    if (targetIsAdmin) {
      throw error_.new('target user is also a group admin', 403, reqUserId, groupId, targetId)
    }
  })
}
