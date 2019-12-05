const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const sanitize = __.require('lib', 'sanitize/sanitize')
const groups_ = require('./lib/groups')
const membershipActions = require('./lib/membership_actions')
const { Track } = __.require('lib', 'track')
const error_ = __.require('lib', 'error/error')

module.exports = action => (req, res) => {
  sanitize(req, res, { group: {} })
  .then(params => {
    const { group: groupId, reqUserId } = params
    _.log(params, `${action} group`)

    return groups_.userInvited(reqUserId, groupId)
    .then(membershipActions[action].bind(null, params, reqUserId))
    .then(addUpdateData(res))
    .then(Track(req, [ 'groups', action ]))
  })
  .catch(error_.Handler(req, res))
}

// Allow to pass an update object, with key/values to be updated on the model
// as the results of update hooks
const addUpdateData = res => (data = {}) => {
  res.json({ ok: true, update: data.update })
}
