__ = require('config').universalPath
_ = __.require 'builders', 'utils'
user_ = __.require 'controllers', 'user/lib/user'
intent = require './lib/intent'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
{ Track } = __.require 'lib', 'track'

module.exports = (req, res, next)->
  unless req.user? then return error_.unauthorizedApiAccess req, res

  { user, action } = req.body

  unless _.isString(action) and action in possibleActions
    return error_.bundle req, res, 'bad actions parameter', 400, req.body
  unless _.isUserId user
    return error_.bundle req, res, 'bad user parameter', 400, req.body

  reqUserId = req.user._id

  promises_.try -> solveNewRelation action, user, reqUserId
  .then _.success.bind(null, user, "#{action}: OK!")
  .then _.Ok(res)
  .then Track(req, ['relation', action])
  .catch error_.Handler(req, res)

solveNewRelation = (action, othersId, reqUserId)->
  if reqUserId is othersId
    throw error_.new 'cant create relation between identical ids', 400, arguments

  type = actions[action]
  return intent[type](reqUserId, othersId)

actions =
  request: 'requestFriend'
  cancel: 'cancelFriendRequest'
  accept: 'acceptRequest'
  discard: 'discardRequest'
  unfriend: 'removeFriendship'

possibleActions = Object.keys actions
