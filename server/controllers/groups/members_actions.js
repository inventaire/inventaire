import { log } from '#lib/utils/logs'
import { groupAction } from './lib/group_action.js'
import membershipValidations from './lib/membership_validations.js'

const sanitization = {
  group: {},
  user: { optional: true },
}

const controller = action => async params => {
  const { group: groupId, user: userId, reqUserId } = params
  log(params, `${action} group`)
  await membershipValidations[action](reqUserId, groupId, userId)
  await groupAction(action, params)
  return { ok: true }
}

export default action => ({
  sanitization,
  controller: controller(action),
  track: [ 'groups', action ],
})
