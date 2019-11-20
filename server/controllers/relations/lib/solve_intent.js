const CONFIG = require('config')
const __ = CONFIG.universalPath
const { godMode } = CONFIG
const _ = __.require('builders', 'utils')

module.exports = actions => {
  const API = {
    requestFriend: (userId, otherId, status) => {
      // useful for development
      if (godMode) return actions.forceFriendship(userId, otherId)
      if (status === 'none') return actions.makeRequest(userId, otherId)
      else if (status === 'otherRequested') return actions.simultaneousRequest(userId, otherId)
      else doNothing(status, 'requestFriend', userId, otherId)
    },

    cancelFriendRequest: (userId, otherId, status) => {
      if (status === 'userRequested') return actions.removeRelation(userId, otherId)
      else doNothing(status, 'cancelFriendRequest', userId, otherId)
    },

    removeFriendship: (userId, otherId, status) => {
      if (status === 'friends' || status === 'userRequested' || status === 'otherRequested') {
        return actions.removeRelation(userId, otherId)
      } else {
        doNothing(status, 'removeFriendship', userId, otherId)
      }
    },

    acceptRequest: (userId, otherId, status) => {
      if (status === 'otherRequested') {
        return actions.acceptRequest(userId, otherId)
      } else if (status === 'none') {
        return _.warn(`${userId} request to ${otherId} accepted after being cancelled`)
      } else {
        doNothing(status, 'acceptRequest', userId, otherId)
      }
    },

    discardRequest: (userId, otherId, status) => {
      if (status === 'otherRequested') return actions.removeRelation(userId, otherId)
      else doNothing(status, 'discardRequest', userId, otherId)
    }
  }

  return API
}

const doNothing = (status, method, userId, otherId) => {
  _.warn(`Status mismatch: got status '${status}' \
  at ${method} for relation ${userId}, ${otherId}. \
  (it happens but it shouldn't be to often). \
  Here, doing nothing is the best.`)
}
