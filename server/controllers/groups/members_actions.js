import _ from 'builders/utils'
import modelAction from './lib/model_action'
import membershipValidations from './lib/membership_validations'

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

export default action => ({
  sanitization,
  controller: controller(action),
  track: [ 'groups', action ]
})
