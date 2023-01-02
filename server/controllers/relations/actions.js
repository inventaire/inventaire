import _ from '#builders/utils'
import error_ from '#lib/error/error'
import intent from './lib/intent.js'

const sanitization = {
  user: {}
}

const controller = action => async params => {
  const { reqUserId, user: userId } = params
  await solveNewRelation(action, userId, reqUserId)
  _.success(userId, `${action}: OK!`)
  return { ok: true }
}

export default action => ({
  sanitization,
  controller: controller(action),
  track: [ 'relation', action ]
})

const solveNewRelation = async (action, othersId, reqUserId) => {
  if (reqUserId === othersId) {
    throw error_.new('cant create relation between identical ids', 400, { action, othersId, reqUserId })
  }

  const type = actions[action]
  return intent[type](reqUserId, othersId)
}

const actions = {
  request: 'requestFriend',
  cancel: 'cancelFriendRequest',
  accept: 'acceptRequest',
  discard: 'discardRequest',
  unfriend: 'removeFriendship'
}
