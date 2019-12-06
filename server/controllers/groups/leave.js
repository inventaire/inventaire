const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const sanitize = __.require('lib', 'sanitize/sanitize')
const groups_ = require('./lib/groups')
const modelAction = require('./lib/model_action')
const { Track } = __.require('lib', 'track')
const error_ = __.require('lib', 'error/error')
const promises_ = __.require('lib', 'promises')

module.exports = (req, res) => {
  sanitize(req, res, { group: {} })
  .then(params => {
    const { group: groupId, reqUserId } = params
    _.log(params, 'leave group')

    return validateRightToLeave(reqUserId, groupId)
    .then(modelAction('leave').bind(null, params, reqUserId))
    .then(addUpdateData(res))
    .then(Track(req, [ 'groups', 'leave' ]))
  })
  .catch(error_.Handler(req, res))
}

// Allow to pass an update object, with key/values to be updated on the model
// as the results of update hooks
const addUpdateData = res => (data = {}) => {
  res.json({ ok: true, update: data.update })
}

const validateRightToLeave = (reqUserId, groupId) => {
  return promises_.all([
    groups_.userInGroup(reqUserId, groupId),
    groups_.userCanLeave(reqUserId, groupId)
  ])
  .spread((userInGroup, userCanLeave) => {
    if (!userInGroup) {
      throw error_.new('user is not in the group', 403, reqUserId, groupId)
    }
    if (!userCanLeave) {
      const message = "the last group admin can't leave before naming another admin"
      throw error_.new(message, 403, reqUserId, groupId)
    }
  })
}
