__ = require('config').universalPath
_ = __.require 'builders', 'utils'
Radio = __.require 'lib', 'radio'
{ BasicUpdater } = __.require 'lib', 'doc_updates'

db = __.require('couch', 'base')('notifications')

notifs_ =
  byUserId: (userId)->
    _.type userId, 'string'
    db.viewCustom 'byUserAndTime',
      startkey: [userId, 0]
      endkey: [userId, {}]
      include_docs: true
    .catch _.Error('byUserId')

  add: (userId, type, data)->
    _.types arguments, ['string', 'string', 'object']
    db.post
      user: userId
      type: type
      data: data
      status: 'unread'
      time: Date.now()

  updateReadStatus: (userId, time)->
    time = Number(time)
    db.viewFindOneByKey 'byUserAndTime', [userId, time]
    .then (doc)->
      db.update doc._id, BasicUpdater('status', 'read')

  deleteAllByUserId: (userId)->
    notifs_.byUserId userId
    .then db.bulkDelete

  unreadCount: (userId)->
    notifs_.byUserId userId
    .then getUnreadCount

getUnreadCount = (notifs)-> notifs.filter(isUnread).length
isUnread = (notif)-> notif.status is 'unread'

callbacks =
  acceptedRequest: (userToNotify, newFriend)->
    _.types arguments, ['string', 'string']
    notifs_.add userToNotify, 'friendAcceptedRequest',
      user: newFriend

  newCommentOnFollowedItem: (itemId, commentorId, users)->
    for userToNotify in users
      notifs_.add userToNotify, 'newCommentOnFollowedItem',
        item: itemId
        user: commentorId

  userMadeAdmin: (groupId, actorAdminId, newAdminId)->
    notifs_.add newAdminId, 'userMadeAdmin',
      group: groupId
      user: actorAdminId

  groupUpdate: (data)->
    { attribute } = data
    if attribute in groupAttributeWithNotification
      { usersToNotify, groupId, actorId, previousValue, newValue } = data
      # creates a lot of similar documents:
      # could be refactored to use a single document
      # including a read status per-user: { user: id, read: boolean }
      for userToNotify in usersToNotify
        notifs_.add userToNotify, 'groupUpdate',
          group: groupId
          user: actorId
          attribute: attribute
          previousValue: previousValue
          newValue: newValue

groupAttributeWithNotification = [ 'name', 'description' ]

Radio.on 'notify:friend:request:accepted', callbacks.acceptedRequest
Radio.on 'notify:comment:followers', callbacks.newCommentOnFollowedItem
Radio.on 'group:makeAdmin', callbacks.userMadeAdmin
Radio.on 'group:update', callbacks.groupUpdate

module.exports = notifs_
