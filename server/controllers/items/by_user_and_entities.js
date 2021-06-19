const items_ = require('controllers/items/lib/items')
const user_ = require('controllers/user/lib/user')
const { areFriendsOrGroupCoMembers } = require('controllers/user/lib/relations_status')

const sanitization = {
  user: {},
  uris: {},
  limit: { optional: true },
  offset: { optional: true },
  // 'users' is pluralize to be consistent with flags on other items endpoints
  'include-users': {
    optional: true,
    generic: 'boolean'
  }
}

const controller = async ({ userId, uris, reqUserId, includeUsers }) => {
  return user_.getUserById(userId, reqUserId)
  .then(getItemsFromUser(reqUserId, uris, includeUsers))
}

const getItemsFromUser = (reqUserId, uris, includeUsers) => user => {
  const { _id: ownerId } = user
  return getAuthorizationLevel(reqUserId, ownerId)
  .then(listingKey => {
    return items_.byOwnersAndEntitiesAndListings([ ownerId ], uris, listingKey, reqUserId)
    .then(items => {
      if (includeUsers) return { users: [ user ], items }
      else return { items }
    })
  })
}

const getAuthorizationLevel = async (reqUserId, ownerId) => {
  if (reqUserId == null) return 'public'
  if (reqUserId === ownerId) return 'user'

  return areFriendsOrGroupCoMembers(reqUserId, ownerId)
  .then(bool => bool === true ? 'network' : 'public')
}

module.exports = { sanitization, controller }
