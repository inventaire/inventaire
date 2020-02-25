const __ = require('config').universalPath
const items_ = __.require('controllers', 'items/lib/items')
const user_ = __.require('controllers', 'user/lib/user')
const { areFriendsOrGroupCoMembers } = __.require('controllers', 'user/lib/relations_status')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const sanitize = __.require('lib', 'sanitize/sanitize')

const sanitization = {
  user: {},
  uri: {},
  limit: { optional: true },
  offset: { optional: true }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { userId, uri, reqUserId } = params
    return user_.getUserById(userId, reqUserId)
    .then(getItemsFromUser(reqUserId, uri))
  })
  .then(responses_.Send(res))
  .catch(error_.Handler(req, res))
}

const getItemsFromUser = (reqUserId, uri) => user => {
  const { _id: ownerId } = user
  return getAuthorizationLevel(reqUserId, ownerId)
  .then(listingKey => {
    return items_.byOwnersAndEntitiesAndListings([ ownerId ], [ uri ], listingKey, reqUserId)
    .then(items => ({ users: [ user ], items }))
  })
}

const getAuthorizationLevel = async (reqUserId, ownerId) => {
  if (reqUserId == null) return 'public'
  if (reqUserId === ownerId) return 'user'

  return areFriendsOrGroupCoMembers(reqUserId, ownerId)
  .then(bool => bool === true ? 'network' : 'public')
}
