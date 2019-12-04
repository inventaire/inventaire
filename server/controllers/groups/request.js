const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const sanitize = __.require('lib', 'sanitize/sanitize')
const groups_ = require('./lib/groups')
const membershipActions = require('./lib/membership_actions')
const { Track } = __.require('lib', 'track')
const error_ = __.require('lib', 'error/error')

module.exports = (req, res) => {
  sanitize(req, res, { group: {} })
  .then(params => {
    const { group: groupId, reqUserId } = params
    _.log(params, 'request group')

    return requestValidation(reqUserId, groupId)
    .then(membershipActions.request.bind(null, params, reqUserId))
    .then(addUpdateData(res))
    .then(Track(req, [ 'groups', 'request' ]))
  })
  .catch(error_.Handler(req, res))
}

// Allow to pass an update object, with key/values to be updated on the model
// as the results of update hooks
const addUpdateData = res => (data = {}) => {
  res.json({ ok: true, update: data.update })
}

const requestValidation = (reqUserId, groupId) => {
  return groups_.userInGroupOrOut(reqUserId, groupId)
  .then(bool => {
    if (bool) {
      throw error_.new('user is already in group', 403, reqUserId, groupId)
    }
  })
}
