const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const sanitize = __.require('lib', 'sanitize/sanitize')
const groups_ = require('./lib/groups')
const membershipActions = require('./lib/membership_actions')
const { Track } = __.require('lib', 'track')
const error_ = __.require('lib', 'error/error')

module.exports = (req, res) => {
  sanitize(req, res, { group: {}, user: {} })
  .then(params => {
    const { group: groupId, user: userId, reqUserId } = params
    _.log(params, 'make admin request group')

    return validateAdminRights(reqUserId, groupId, userId)
    .then(membershipActions.makeAdmin.bind(null, params, reqUserId))
    .then(addUpdateData(res))
    .then(Track(req, [ 'groups', 'make admin request' ]))
  })
  .catch(error_.Handler(req, res))
}

// Allow to pass an update object, with key/values to be updated on the model
// as the results of update hooks
const addUpdateData = res => (data = {}) => {
  res.json({ ok: true, update: data.update })
}

const validateAdminRights = (reqUserId, groupId) => {
  return groups_.userInAdmins(reqUserId, groupId)
  .then(bool => {
    if (!bool) {
      throw error_.new('user isnt a group admin', 403, reqUserId, groupId)
    }
  })
}
