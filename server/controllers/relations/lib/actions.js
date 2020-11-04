const CONFIG = require('config')
const __ = CONFIG.universalPath
const queries_ = require('./queries')
const radio = __.require('lib', 'radio')
const { tapEmit } = radio

module.exports = {
  acceptRequest: (userId, otherId) => {
    return queries_.putFriendStatus(userId, otherId)
    .then(tapEmit('notify:friend:request:accepted', otherId, userId))
  },

  simultaneousRequest: (userId, otherId) => {
    return queries_.putFriendStatus(userId, otherId)
    .then(tapEmit('notify:friend:request:accepted', otherId, userId))
    .then(tapEmit('notify:friend:request:accepted', userId, otherId))
  },

  makeRequest: async (inviterId, recipientId, notify = true) => {
    const res = await queries_.putRequestedStatus(inviterId, recipientId)
    // Use notify=false to avoid emails when a new user is created with waiting
    // email invitations, which are then converted into requests
    if (notify) await radio.emit('notify:friendship:request', recipientId, inviterId)
    return res
  },

  removeRelation: queries_.putNoneStatus
}
