const _ = require('builders/utils')
const getByAccessLevel = require('./get_by_access_level')
const items_ = require('controllers/items/lib/items')
const groups_ = require('controllers/groups/lib/groups')
const buildKeysFromShelf = require('controllers/items/lib/build_keys_from_shelf')
const getInventoryAccessLevel = require('./get_inventory_access_level')

// Return what the reqUserId user is allowed to see
module.exports = {
  byUser: async (userId, reqUserId, options = {}) => {
    const accessLevel = await getInventoryAccessLevel(userId, reqUserId)
    return getByAccessLevel[accessLevel](userId, reqUserId, options)
  },

  byGroup: async (groupId, reqUserId) => {
    const allGroupMembers = await groups_.getGroupMembersIds(groupId)
    if (reqUserId && allGroupMembers.includes(reqUserId)) {
      return getByAccessLevel.network(allGroupMembers)
    } else {
      return getByAccessLevel.public(allGroupMembers)
    }
  },

  byShelves: async (shelves, reqUserId) => {
    const keysArray = await Promise.all(shelves.map(buildKeysFromShelf(reqUserId)))
    const keys = _.flatten(keysArray)
    return items_.byShelvesAndListing(keys, reqUserId)
  },

  byShelf: async (shelf, reqUserId) => {
    const keys = await buildKeysFromShelf(reqUserId)(shelf)
    return items_.byShelvesAndListing(keys, reqUserId)
  }
}
