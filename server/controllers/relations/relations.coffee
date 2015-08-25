__ = require('config').root
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user/user'
intent = require './lib/intent'
error_ = __.require 'lib', 'error/error'
tests = __.require 'models', 'tests/common-tests'

module.exports.post = (req, res, next) ->
  { user, action } = req.body

  unless _.isString(action) and action in possibleActions
    return error_.bundle res, 'bad actions parameter', 400, req.body
  unless tests.userId user
    return error_.bundle res, 'bad user parameter', 400, req.body

  user_.getUserId req
  .then solveNewRelation.bind(null, action, user)
  .then _.success.bind(null, user, "#{action}: OK!")
  .then _.Ok(res)
  .catch error_.Handler(res)

solveNewRelation = (action, othersId, userId)->
  if userId is othersId
    throw error_.new 'cant create relation between identical ids', 400, arguments

  type = actions[action]
  return method type, userId, othersId

method = (type, userId, othersId)->
  intent[type](userId, othersId)

actions =
  request: 'requestFriend'
  cancel: 'cancelFriendRequest'
  accept: 'acceptRequest'
  discard: 'discardRequest'
  unfriend: 'removeFriendship'

possibleActions = Object.keys actions