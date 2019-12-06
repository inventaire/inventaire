const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const sanitize = __.require('lib', 'sanitize/sanitize')
const groups_ = require('./lib/groups')
const membershipValidations = require('./lib/membership_validations')
const { Track } = __.require('lib', 'track')
const error_ = __.require('lib', 'error/error')

const sanitization = {
  group: {},
  attribute: {},
  value: {}
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    // don't convert undefined action to an empty string
    // it makes debugging confusing

    const { group: groupId, reqUserId } = params
    _.log(params, 'update group settings')

    return membershipValidations.updateSettings(reqUserId, groupId)
    .then(groups_.updateSettings.bind(null, params, reqUserId))
    .then(addUpdateData(res))
    .then(Track(req, [ 'groups', 'update settings' ]))
  })
  .catch(error_.Handler(req, res))
}

// Allow to pass an update object, with key/values to be updated on the model
// as the results of update hooks
const addUpdateData = res => (data = {}) => {
  res.json({ ok: true, update: data.update })
}
