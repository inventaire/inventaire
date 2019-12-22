const CONFIG = require('config')
const __ = CONFIG.universalPath
const queries_ = require('./queries')
const radio = __.require('lib', 'radio')

module.exports = {
  acceptRequest: (userId, otherId) => {
    return queries_.putFriendStatus(userId, otherId)
    .tap(() => radio.emit('notify:friend:request:accepted', otherId, userId))
  },

  simultaneousRequest: (userId, otherId) => {
    return queries_.putFriendStatus(userId, otherId)
    .tap(() => {
      radio.emit('notify:friend:request:accepted', otherId, userId)
      radio.emit('notify:friend:request:accepted', userId, otherId)
    })
  },

  makeRequest: (inviterId, recipientId, notify = true) => {
    return queries_.putRequestedStatus(inviterId, recipientId)
    .tap(() => {
      // Use notify=false to avoid emails when a new user is created with waiting
      // email invitations, which are then converted into requests
      if (notify) radio.emit('notify:friendship:request', recipientId, inviterId)
    })
  },

  removeRelation: queries_.putNoneStatus,

  // Used by godMode
  forceFriendship: (userId, otherId) => {
    return queries_.putFriendStatus(userId, otherId)
  }
}
