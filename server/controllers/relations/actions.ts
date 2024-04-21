import { newError } from '#lib/error/error'
import { success } from '#lib/utils/logs'
import * as intent from './lib/intent.js'

const sanitization = {
  user: {},
}

const controller = action => async params => {
  const { reqUserId, user: userId } = params
  await solveNewRelation(action, userId, reqUserId)
  success(userId, `${action}: OK!`)
  return { ok: true }
}

export default action => ({
  sanitization,
  controller: controller(action),
  track: [ 'relation', action ],
})

async function solveNewRelation (action, othersId, reqUserId) {
  if (reqUserId === othersId) {
    throw newError('cant create relation between identical ids', 400, { action, othersId, reqUserId })
  }

  const type = actions[action]
  return intent[type](reqUserId, othersId)
}

const actions = {
  request: 'requestFriend',
  cancel: 'cancelFriendRequest',
  accept: 'acceptRequest',
  discard: 'discardRequest',
  unfriend: 'removeFriendship',
}
