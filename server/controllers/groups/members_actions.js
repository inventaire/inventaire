const _ = require('builders/utils')
const modelAction = require('./lib/model_action')
const membershipValidations = require('./lib/membership_validations')

const sanitization = {
  group: {},
  user: { optional: true }
}

const controller = action => async params => {
  const { group: groupId, user: userId, reqUserId } = params
  _.log(params, `${action} group`)
  await membershipValidations[action](reqUserId, groupId, userId)
  await modelAction(action, params)
  return { ok: true }
}

module.exports = action => ({
  sanitization,
  controller: controller(action),
  track: [ 'groups', action ]
})
