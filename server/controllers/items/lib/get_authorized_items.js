const __ = require('config').universalPath
const _ = __.require('builders', 'utils')

const getByAccessLevel = require('./get_by_access_level')
const { areFriendsOrGroupCoMembers } = __.require('controllers', 'user/lib/relations_status')
const items_ = __.require('controllers', 'items/lib/items')
const groups_ = __.require('controllers', 'groups/lib/groups')
const buildKeysFromShelf = __.require('controllers', 'items/lib/build_keys_from_shelf')

// Return what the reqUserId user is allowed to see
module.exports = {
  byUser: (userId, reqUserId) => {
    if (userId === reqUserId) return getByAccessLevel.private(userId)
    if (!reqUserId) return getByAccessLevel.public(userId)
    return areFriendsOrGroupCoMembers(userId, reqUserId)
    .then(usersAreFriendsOrGroupCoMembers => {
      if (usersAreFriendsOrGroupCoMembers) return getByAccessLevel.network(userId)
      else return getByAccessLevel.public(userId)
    })
  },

  byGroup: (groupId, reqUserId) => {
    return groups_.getGroupMembersIds(groupId)
    .then(allGroupMembers => {
      if (reqUserId && allGroupMembers.includes(reqUserId)) return getByAccessLevel.network(allGroupMembers)
      else return getByAccessLevel.public(allGroupMembers)
    })
  },

  byShelves: async (shelves, reqUserId) => {
    return Promise.all(shelves.map(buildKeysFromShelf(reqUserId)))
    .then(_.flatten)
    .then(keys => { return items_.byShelvesAndListing(keys, reqUserId) })
  },

  byShelf: async (shelf, reqUserId) => {
    return buildKeysFromShelf(reqUserId)(shelf)
    .then(keys => { return items_.byShelvesAndListing(keys, reqUserId) })
  }
}
