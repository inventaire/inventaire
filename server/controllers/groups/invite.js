const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const groups_ = require('./lib/groups')
const { Track } = __.require('lib', 'track')
const sanitize = __.require('lib', 'sanitize/sanitize')

const sanitization = {
  user: {},
  group: {}
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { group: groupId, user: userId, reqUserId } = params
    _.log([ reqUserId, params ], 'invite group')

    return verifyRightsToInvite(reqUserId, groupId, userId)
    .then(groups_.invite.bind(null, params, reqUserId))
    // Allow to pass an update object, with key/values to be updated on the model
    // as the results of update hooks
    .then(addUpdateData(res))
    .then(Track(req, [ 'groups', 'invite' ]))
  })
  .catch(error_.Handler(req, res))
}

const addUpdateData = res => (data = {}) => {
  res.json({ ok: true, update: data.update })
}

const verifyRightsToInvite = (reqUserId, groupId, invitedUserId) => {
  return groups_.userInGroup(reqUserId, groupId)
  .then(invitorInGroup => {
    if (!invitorInGroup) {
      const context = { reqUserId, groupId, invitedUserId }
      throw error_.new("invitor isn't in group", 403, context)
    }
  })
}
