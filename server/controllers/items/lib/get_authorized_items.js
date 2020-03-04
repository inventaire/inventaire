const __ = require('config').universalPath
const getByAccessLevel = require('./get_by_access_level')
const { areFriendsOrGroupCoMembers } = __.require('controllers', 'user/lib/relations_status')
const { getNetworkIds } = __.require('controllers', 'user/lib/relations_status')
const filterVisibleShelves = __.require('controllers', 'shelves/lib/filter_visible_shelves')
const items_ = __.require('controllers', 'items/lib/items')
const groups_ = __.require('controllers', 'groups/lib/groups')
const shelves_ = __.require('controllers', 'shelves/lib/shelves')

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

  byShelf: (shelfId, reqUserId) => {
    return Promise.all([ shelves_.byIdsWithItems([ shelfId ]), getNetworkIds(reqUserId) ])
    .then(filterVisibleShelves(reqUserId))
    .then(([ shelf ]) => items_.byIds(shelf.items))
  }
}
