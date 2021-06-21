const _ = require('builders/utils')
const membershipValidations = require('./lib/membership_validations')
const updateSettings = require('./lib/update_settings')

const sanitization = {
  group: {},
  attribute: {},
  value: {
    canBeNull: true
  }
}

const controller = async params => {
  const { group: groupId, reqUserId } = params
  _.log(params, 'update group settings')

  await membershipValidations.updateSettings(reqUserId, groupId)
  const { hooksUpdates } = await updateSettings(params, reqUserId)
  // Allow to pass an update object, with key/values to be updated on the client-side model
  // as the results of update hooks
  // Only current case: the slug might be updated after an update of the group name
  return { ok: true, update: hooksUpdates }
}

module.exports = {
  sanitization,
  controller,
  track: [ 'groups', 'updateSettings' ]
}
