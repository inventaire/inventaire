__ = require('config').root
_ = __.require 'builders', 'utils'
user = __.require 'lib', 'user'
socialGraph = __.require 'graph', 'social_graph'


module.exports.actions = (req, res, next) ->
  _.log query = req.query, 'relations.actions query'
  [action, othersId] = [query.action, query.user]
  if action? and othersId?
    user.getUserId(req.session.email)
    .then (userId)->
      if userId isnt othersId
        switch action
          when 'request'  then return request(userId, othersId)
          when 'cancel' then return cancel(userId, othersId)
          when 'accept' then return accept(userId, othersId)
          when 'discard' then return discard(userId, othersId)
          when 'unfriend' then return unfriend(userId, othersId)
      else throw new Error('cant create relation between identical ids')
    .then ->
      _.success othersId, "#{action}: OK!"
      res.json {status: 'ok'}
    .catch (err)->
      _.errorHandler res, ['relations actions err', err], 400
  else
    _.errorHandler res, 'bad relations query', 400


request = (userId, othersId)->
  socialGraph.requestFriend userId, othersId

cancel = (userId, othersId)->
  socialGraph.cancelFriendRequest userId, othersId

accept = (userId, othersId)->
  socialGraph.acceptRequest userId, othersId

discard = (userId, othersId)->
  socialGraph.discardRequest userId, othersId

unfriend = (userId, othersId)->
  socialGraph.removeFriendship userId, othersId