import queries from './queries.js'
import actions from './actions.js'
import solveFactory from './solve_intent.js'

const solve = solveFactory(actions)

export default {
  requestFriend: (reqUserId, otherId) => {
    return queries.getStatus(reqUserId, otherId)
    .then(solve.requestFriend.bind(null, reqUserId, otherId))
  },

  cancelFriendRequest: (reqUserId, otherId) => {
    return queries.getStatus(reqUserId, otherId)
    .then(solve.cancelFriendRequest.bind(null, reqUserId, otherId))
  },

  removeFriendship: (reqUserId, otherId) => {
    return queries.getStatus(reqUserId, otherId)
    .then(solve.removeFriendship.bind(null, reqUserId, otherId))
  },

  acceptRequest: (reqUserId, otherId) => {
    return queries.getStatus(reqUserId, otherId)
    .then(solve.acceptRequest.bind(null, reqUserId, otherId))
  },

  discardRequest: (reqUserId, otherId) => {
    return queries.getStatus(reqUserId, otherId)
    .then(solve.discardRequest.bind(null, reqUserId, otherId))
  }
}
