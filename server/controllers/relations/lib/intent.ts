import { getRelationStatus } from '#controllers/relations/lib/queries'
import * as actions from './actions.js'
import solveFactory from './solve_intent.js'

const solve = solveFactory(actions)

export function requestFriend (reqUserId, otherId) {
  return getRelationStatus(reqUserId, otherId)
  .then(solve.requestFriend.bind(null, reqUserId, otherId))
}

export function cancelFriendRequest (reqUserId, otherId) {
  return getRelationStatus(reqUserId, otherId)
  .then(solve.cancelFriendRequest.bind(null, reqUserId, otherId))
}

export function removeFriendship (reqUserId, otherId) {
  return getRelationStatus(reqUserId, otherId)
  .then(solve.removeFriendship.bind(null, reqUserId, otherId))
}

export function acceptRequest (reqUserId, otherId) {
  return getRelationStatus(reqUserId, otherId)
  .then(solve.acceptRequest.bind(null, reqUserId, otherId))
}

export function discardRequest (reqUserId, otherId) {
  return getRelationStatus(reqUserId, otherId)
  .then(solve.discardRequest.bind(null, reqUserId, otherId))
}
