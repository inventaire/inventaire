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
      _.log arguments, 'action arguments'
      if userId isnt othersId
        switch action
          when 'request'  then type = 'requestFriend'
          when 'cancel' then type = 'cancelFriendRequest'
          when 'accept' then type = 'acceptRequest'
          when 'discard' then type = 'discardRequest'
          when 'unfriend' then type = 'removeFriendship'
        return method(type, userId, othersId)
      else throw new Error('cant create relation between identical ids')
    .then ->
      _.success othersId, "#{action}: OK!"
      res.json {status: 'ok'}
    .catch (err)->
      _.error err, 'relations actions err'
      _.errorHandler res, null, 400
  else
    _.errorHandler res, 'bad relations query', 400

method = (type, userId, othersId)->
  _.log arguments, 'action arguments'
  socialGraph[type](userId, othersId)