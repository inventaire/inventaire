const groups_ = require('controllers/groups/lib/groups')
const { getAllowedVisibilityKeys } = require('lib/visibility/allowed_visibility_keys')
const { filterPrivateAttributes } = require('controllers/items/lib/filter_private_attributes')
const db = require('db/couchdb/base')('items')
const _ = require('builders/utils')
const { uniqByKey } = require('lib/utils/base')
const { getGroupVisibilityKey } = require('lib/visibility/visibility')

// Return what the reqUserId user is allowed to see
module.exports = {
  byUser: async (userId, reqUserId, options = {}) => {
    const allowedVisibilityKeys = await getAllowedVisibilityKeys(userId, reqUserId)
    return getUsersItems({
      usersIds: [ userId ],
      reqUserId,
      allowedVisibilityKeys,
      withoutShelf: options.withoutShelf,
    })
  },

  byGroup: async (groupId, reqUserId) => {
    const allGroupMembersIds = await groups_.getGroupMembersIds(groupId)
    const allowedVisibilityKeys = [ 'public' ]
    if (reqUserId && allGroupMembersIds.includes(reqUserId)) {
      allowedVisibilityKeys.push('groups', getGroupVisibilityKey(groupId))
    }
    return getUsersItems({
      usersIds: allGroupMembersIds,
      reqUserId,
      allowedVisibilityKeys,
    })
  },

  byShelves: async (shelves, reqUserId) => {
    const keys = await getShelvesAllowedVisibilityKeys(shelves, reqUserId)
    return getItemsFromViewAndAllowedVisibilityKeys('byShelfAndVisibilityKey', keys, reqUserId)
  }
}

const getShelvesAllowedVisibilityKeys = async (shelves, reqUserId) => {
  const ownersIds = _.uniq(_.map(shelves, 'owner'))
  const ownerIdAndVisibilityKeys = await Promise.all(ownersIds.map(getOwnerIdAndVisibilityKeys(reqUserId)))
  const allowedVisibilityKeysByOwner = Object.fromEntries(ownerIdAndVisibilityKeys)
  return shelves.flatMap(shelf => {
    const allowedVisibilityKeys = allowedVisibilityKeysByOwner[shelf.owner]
    return _.combinations([ shelf._id ], allowedVisibilityKeys)
  })
}

const getOwnerIdAndVisibilityKeys = reqUserId => async ownerId => {
  const keys = await getAllowedVisibilityKeys(ownerId, reqUserId)
  return [ ownerId, keys ]
}

const getUsersItems = async ({ usersIds, reqUserId, allowedVisibilityKeys, withoutShelf = false }) => {
  const view = withoutShelf ? 'byOwnerAndVisibilityKeyWithoutShelf' : 'byOwnerAndVisibilityKey'
  const keys = _.combinations(usersIds, allowedVisibilityKeys)
  return getItemsFromViewAndAllowedVisibilityKeys(view, keys, reqUserId)
}

// Alternative implementation:
// - do not include_docs in the first request
// - deduplicate ids
// - fetch deduplicate docs by ids
const getItemsFromViewAndAllowedVisibilityKeys = async (view, keys, reqUserId) => {
  let items = await db.viewByKeys(view, keys)
  // Items with several visibility keys might be returned several times,
  // thus the need to deduplicate items
  items = uniqByKey(items, '_id')
  return items.map(filterPrivateAttributes(reqUserId))
}
