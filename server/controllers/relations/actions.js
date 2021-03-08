const __ = require('config').universalPath
const _ = require('builders/utils')
const intent = require('./lib/intent')
const error_ = require('lib/error/error')
const responses_ = require('lib/responses')
const { Track } = require('lib/track')
const sanitize = require('lib/sanitize/sanitize')

const sanitization = {
  user: {}
}

module.exports = action => (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { reqUserId, user: userId } = params

    return solveNewRelation(action, userId, reqUserId)
    .then(_.success.bind(null, userId, `${action}: OK!`))
  })
  .then(responses_.Ok(res))
  .then(Track(req, [ 'relation', action ]))
  .catch(error_.Handler(req, res))
}

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
