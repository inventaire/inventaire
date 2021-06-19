const _ = require('builders/utils')
const intent = require('./lib/intent')
const error_ = require('lib/error/error')

const sanitization = {
  user: {}
}

const controller = action => async params => {
  const { reqUserId, user: userId } = params
  await solveNewRelation(action, userId, reqUserId)
  _.success(userId, `${action}: OK!`)
  return { ok: true }
}

module.exports = action => ({
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
