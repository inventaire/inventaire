const { customAuthReq } = require('./request')
const endpoint = '/api/relations'

let getUser, getReservedUser
const requireCircularDependencies = () => {
  ({ getUser, getReservedUser } = require('./utils'))
}
setImmediate(requireCircularDependencies)

const getRelations = user => customAuthReq(user, 'get', endpoint)

const getRelationStatus = async (reqUser, otherUser) => {
  const { _id: reqUserId } = reqUser
  const { _id: otherUserId } = otherUser
  const [ reqUserRelations, otherUserRelations ] = await Promise.all([
    getRelations(reqUser),
    getRelations(otherUser)
  ])
  if (reqUserRelations.friends.includes(otherUserId)) return 'friends'
  if (reqUserRelations.otherRequested.includes(otherUserId)) return 'otherRequested'
  // Unfortunatly, the endpoint doesn't return userRequested user ids
  // so we need to query those from the point of view of the other user
  if (otherUserRelations.otherRequested.includes(reqUserId)) return 'userRequested'
  return 'none'
}

const action = (action, reqUser, otherUser) => {
  return customAuthReq(reqUser, 'post', endpoint, {
    action,
    user: otherUser._id
  })
}

module.exports = {
  action,
  getUsersWithoutRelation: () => {
    return Promise.all([
      getUser(),
      getReservedUser()
    ])
    .then(([ userA, userB ]) => ({ userA, userB }))
  },

  makeFriends: (userA, userB) => {
    return action('request', userA, userB)
    .then(() => action('accept', userB, userA))
    .then(() => [ userA, userB ])
  },

  assertRelation: async (userA, userB, relationStatus) => {
    const relationAfterRequest = await getRelationStatus(userA, userB)
    relationAfterRequest.should.equal(relationStatus)
  }
}
