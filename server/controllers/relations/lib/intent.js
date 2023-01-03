import { getRelationStatus } from '#controllers/relations/lib/queries'
import * as actions from './actions.js'
import solveFactory from './solve_intent.js'

const solve = solveFactory(actions)

export const requestFriend = (reqUserId, otherId) => {
  return getRelationStatus(reqUserId, otherId)
  .then(solve.requestFriend.bind(null, reqUserId, otherId))
}

export const cancelFriendRequest = (reqUserId, otherId) => {
  return getRelationStatus(reqUserId, otherId)
  .then(solve.cancelFriendRequest.bind(null, reqUserId, otherId))
}

export const removeFriendship = (reqUserId, otherId) => {
  return getRelationStatus(reqUserId, otherId)
  .then(solve.removeFriendship.bind(null, reqUserId, otherId))
}

export const acceptRequest = (reqUserId, otherId) => {
  return getRelationStatus(reqUserId, otherId)
  .then(solve.acceptRequest.bind(null, reqUserId, otherId))
}

export const discardRequest = (reqUserId, otherId) => {
  return getRelationStatus(reqUserId, otherId)
  .then(solve.discardRequest.bind(null, reqUserId, otherId))
}
