import { checkSpamContent } from '#controllers/user/lib/spam'
import { log } from '#lib/utils/logs'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { AuthentifiedReq } from '#types/server'
import membershipValidations from './lib/membership_validations.js'
import updateSettings from './lib/update_settings.js'

const sanitization = {
  group: {},
  attribute: {},
  value: {
    canBeNull: true,
  },
} as const

async function controller (params: SanitizedParameters, req: AuthentifiedReq) {
  const { group: groupId, reqUserId, attribute, value } = params

  if (attribute === 'name' || attribute === 'description') await checkSpamContent(req.user, value)

  log(params, 'update group settings')

  await membershipValidations.updateSettings(reqUserId, groupId)
  const { hooksUpdates } = await updateSettings({ groupId, attribute, value }, reqUserId)
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
