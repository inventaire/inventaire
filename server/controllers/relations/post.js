const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const intent = require('./lib/intent')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const promises_ = __.require('lib', 'promises')
const { Track } = __.require('lib', 'track')

module.exports = (req, res, next) => {
  if (req.user == null) return error_.unauthorizedApiAccess(req, res)

  const { user, action } = req.body

  if (!_.isString(action) || !possibleActions.includes(action)) {
    return error_.bundle(req, res, 'bad actions parameter', 400, req.body)
  }
  if (!_.isUserId(user)) {
    return error_.bundle(req, res, 'bad user parameter', 400, req.body)
  }

  const reqUserId = req.user._id

  return promises_.try(() => solveNewRelation(action, user, reqUserId))
  .then(_.success.bind(null, user, `${action}: OK!`))
  .then(responses_.Ok(res))
  .then(Track(req, [ 'relation', action ]))
  .catch(error_.Handler(req, res))
}

const solveNewRelation = (action, othersId, reqUserId) => {
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

const possibleActions = Object.keys(actions)
