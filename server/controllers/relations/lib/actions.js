const CONFIG = require('config')
const __ = CONFIG.universalPath
const queries_ = require('./queries')
const radio = __.require('lib', 'radio')

module.exports = {
  acceptRequest: (userId, otherId) => {
    queries_.putFriendStatus(userId, otherId)
    return radio.emit('notify:friend:request:accepted', otherId, userId)
  },
  simultaneousRequest: (userId, otherId) => {
    queries_.putFriendStatus(userId, otherId)
    radio.emit('notify:friend:request:accepted', otherId, userId)
    return radio.emit('notify:friend:request:accepted', userId, otherId)
  },
  makeRequest: (inviterId, recipientId, notify = true) => {
    // Use notify=false to avoid emails when a new user is created with waiting
    // email invitations, which are then converted into requests
    if (notify) { radio.emit('notify:friendship:request', recipientId, inviterId) }
    return queries_.putRequestedStatus(inviterId, recipientId)
  },

  removeRelation: queries_.putNoneStatus,
  // used by godMode
  forceFriendship (userId, otherId) {
    return queries_.putFriendStatus(userId, otherId)
  }
}
