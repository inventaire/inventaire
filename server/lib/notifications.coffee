__ = require('config').root
_ = __.require 'builders', 'utils'
levelBase = __.require 'level', 'base'
API = levelBase.simpleAPI('notifications')
Radio = __.require 'lib', 'radio'


notifs_ =
  API: API
  db: API.sub

  getUserNotifications: (userId)->
    _.types arguments, 'string'
    params =
      gt: userId
      lt: userId + 'Z'
    return API.getStream(params)

  add: (userId, type, data)->
    _.types arguments, 'string', 'string', 'object'
    value = @getValue(type, data)
    key = @getKey(userId, value.time)
    _.info [key, value], 'key, value'
    API.put key, value

  updateReadStatus: (userId, time)->
    key = @getKey(userId, time)
    API.patch key, {status: 'read'}

  getKey: (userId, time)->
    time or= _.now()
    userId + ':' + time

  getValue: (type, data)->
    return value =
      type: type
      data: data
      status: 'unread'
      time: _.now()

callbacks =
  acceptedRequest: (userToNotify, newFriend)->
    _.types arguments, 'string', 'string'
    data = {user: newFriend}
    notifs_.add userToNotify, 'friendAcceptedRequest', data

Radio.on 'notify:friend:request:accepted', callbacks.acceptedRequest


module.exports = notifs_