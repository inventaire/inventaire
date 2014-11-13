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
      switch action
        when 'request'  then return request(userId, othersId)
        when 'cancel' then return cancel(userId, othersId)
        when 'accept' then return accept(userId, othersId)
        when 'remove' then return remove(userId, othersId)
    .then -> res.json {status: 'ok'}
    .catch (err)->
      _.error err, 'relations actions err'
  else
    _.errorHandler res, 'bad relations query', 400


request = (userId, othersId)->
  socialGraph.requestFriend userId, othersId

cancel = (userId, othersId)->
  socialGraph.cancelFriendRequest userId, othersId

accept = (userId, othersId)->
  socialGraph.acceptRequest userId, othersId

remove = (userId, othersId)->
  socialGraph.removeFriendship userId, othersId