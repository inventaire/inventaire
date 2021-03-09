const _ = require('builders/utils')
const sanitize = require('lib/sanitize/sanitize')
const modelAction = require('./lib/model_action')
const membershipValidations = require('./lib/membership_validations')
const { Track } = require('lib/track')
const error_ = require('lib/error/error')
const responses_ = require('lib/responses')

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
    .then(() => modelAction(action, params))
  })
  .then(responses_.Ok(res))
  .then(Track(req, [ 'groups', action ]))
  .catch(error_.Handler(req, res))
}
