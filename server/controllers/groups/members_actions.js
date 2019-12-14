const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const sanitize = __.require('lib', 'sanitize/sanitize')
const modelAction = require('./lib/model_action')
const membershipValidations = require('./lib/membership_validations')
const { Track } = __.require('lib', 'track')
const error_ = __.require('lib', 'error/error')

const sanitization = {
  group: {},
  user: { optional: true }
}

module.exports = action => (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { group: groupId, user: userId, reqUserId } = params
    _.log(params, `${action} group`)

    return membershipValidations[action](reqUserId, groupId, userId)
    .then(modelAction(action).bind(null, params, reqUserId))
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
