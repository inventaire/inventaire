__ = require('config').root
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user/user'
intent = require './lib/intent'
error_ = __.require 'lib', 'error/error'

module.exports.actions = (req, res, next) ->
  _.log query = req.query, 'relations.actions query'
  [action, othersId] = [query.action, query.user]
  unless action? and othersId?
    return error_.bundle res, 'bad relations query', 400

  user_.getUserId(req)
  .then solveNewRelation.bind(null, action, othersId)
  .then ->
    _.success othersId, "#{action}: OK!"
    res.json {status: 'ok'}
  .catch error_.Handler(res)

solveNewRelation = (action, othersId, userId)->
  unless userId isnt othersId
    errMsg = 'cant create relation between identical ids'
    throw error_.new +errMsg, 400, userId othersId

  switch action
    when 'request' then type = 'requestFriend'
    when 'cancel' then type = 'cancelFriendRequest'
    when 'accept' then type = 'acceptRequest'
    when 'discard' then type = 'discardRequest'
    when 'unfriend' then type = 'removeFriendship'

  return method(type, userId, othersId)

method = (type, userId, othersId)->
  _.log arguments, 'action arguments'
  intent[type](userId, othersId)