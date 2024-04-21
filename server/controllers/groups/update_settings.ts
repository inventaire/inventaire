import { log } from '#lib/utils/logs'
import membershipValidations from './lib/membership_validations.js'
import updateSettings from './lib/update_settings.js'

const sanitization = {
  group: {},
  attribute: {},
  value: {
    canBeNull: true,
  },
}

async function controller (params) {
  const { group: groupId, reqUserId } = params
  log(params, 'update group settings')

  await membershipValidations.updateSettings(reqUserId, groupId)
  const { hooksUpdates } = await updateSettings(params, reqUserId)
  // Allow to pass an update object, with key/values to be updated on the client-side model
  // as the results of update hooks
  // Only current case: the slug might be updated after an update of the group name
  return { ok: true, update: hooksUpdates }
}

export default {
  sanitization,
  controller,
  track: [ 'groups', 'updateSettings' ],
}
