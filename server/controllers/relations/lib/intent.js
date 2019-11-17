// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')

const queries = require('./queries')
const actions = require('./actions')
const solve = require('./solve_intent')(actions)

module.exports = {
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
