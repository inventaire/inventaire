import { warn } from '#lib/utils/logs'

export default actions => {
  return {
    requestFriend: (userId, otherId, status) => {
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
        return warn(`${userId} request to ${otherId} accepted after being cancelled`)
      } else {
        doNothing(status, 'acceptRequest', userId, otherId)
      }
    },

    discardRequest: (userId, otherId, status) => {
      if (status === 'otherRequested') return actions.removeRelation(userId, otherId)
      else doNothing(status, 'discardRequest', userId, otherId)
    },
  }
}

function doNothing (status, method, userId, otherId) {
  warn(`Status mismatch: got status '${status}' \
  at ${method} for relation ${userId}, ${otherId}. \
  (it happens but it shouldn't be to often). \
  Here, doing nothing is the best.`)
}
