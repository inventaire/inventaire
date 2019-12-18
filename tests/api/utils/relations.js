const { customAuthReq } = require('./utils')
const endpoint = '/api/relations'

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

module.exports = {
  action: (action, reqUser, otherUser) => {
    return customAuthReq(reqUser, 'post', endpoint, {
      action,
      user: otherUser._id
    })
  },

  assertRelation: async (userA, userB, relationStatus) => {
    const relationAfterRequest = await getRelationStatus(userA, userB)
    relationAfterRequest.should.equal(relationStatus)
  }
}
