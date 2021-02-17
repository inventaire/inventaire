const CONFIG = require('config')
const __ = CONFIG.universalPath
const queries_ = require('./queries')
const radio = __.require('lib', 'radio')

module.exports = {
  acceptRequest: async (userId, otherId) => {
    const res = await queries_.putFriendStatus(userId, otherId)
    await radio.emit('notify:friend:request:accepted', otherId, userId)
    return res
  },

  simultaneousRequest: async (userId, otherId) => {
    const res = await queries_.putFriendStatus(userId, otherId)
    await radio.emit('notify:friend:request:accepted', otherId, userId)
    await radio.emit('notify:friend:request:accepted', userId, otherId)
    return res
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
