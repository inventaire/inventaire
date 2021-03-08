const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = require('builders/utils')
const sanitize = require('lib/sanitize/sanitize')
const membershipValidations = require('./lib/membership_validations')
const updateSettings = require('./lib/update_settings')
const { Track } = require('lib/track')
const error_ = require('lib/error/error')

const sanitization = {
  group: {},
  attribute: {},
  value: {}
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { group: groupId, reqUserId } = params
    _.log(params, 'update group settings')

    return membershipValidations.updateSettings(reqUserId, groupId)
    .then(() => updateSettings(params, reqUserId))
  })
  .then(respondWithUpdatedData(res))
  .then(Track(req, [ 'groups', 'updateSettings' ]))
  .catch(error_.Handler(req, res))
}

// Allow to pass an update object, with key/values to be updated on the client-side model
// as the results of update hooks
// Only current case: the slug might be updated after an update of the group name
const respondWithUpdatedData = res => ({ hooksUpdates }) => {
  res.json({ ok: true, update: hooksUpdates })
}
