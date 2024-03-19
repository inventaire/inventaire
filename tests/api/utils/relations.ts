import { customAuthReq } from './request.js'

const endpoint = '/api/relations'

let getUser, createUser
const importCircularDependencies = async () => {
  ({ getUser, createUser } = await import('./utils.js'))
}
setImmediate(importCircularDependencies)

const getRelations = user => customAuthReq(user, 'get', endpoint)

export async function getRelationStatus (reqUser, otherUser) {
  const { _id: otherUserId } = otherUser
  const reqUserRelations = await getRelations(reqUser)
  if (reqUserRelations.friends.includes(otherUserId)) return 'friends'
  if (reqUserRelations.userRequested.includes(otherUserId)) return 'userRequested'
  if (reqUserRelations.otherRequested.includes(otherUserId)) return 'otherRequested'
  return 'none'
}

export function action (action, reqUser, otherUser) {
  return customAuthReq(reqUser, 'post', endpoint, {
    action,
    user: otherUser._id,
  })
}

export const getUsersWithoutRelation = () => {
  return Promise.all([
    getUser(),
    createUser(),
  ])
  .then(([ userA, userB ]) => ({ userA, userB }))
}

export async function makeFriendRequest (userA, userB) {
  await action('request', userA, userB)
}

export async function makeFriends (userA, userB) {
  await action('request', userA, userB)
  await action('accept', userB, userA)
  return [ userA, userB ]
}

export async function assertRelation (userA, userB, relationStatus) {
  const relationAfterRequest = await getRelationStatus(userA, userB)
  relationAfterRequest.should.equal(relationStatus)
}
