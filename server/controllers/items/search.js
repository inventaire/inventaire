const error_ = require('lib/error/error')
const searchUsersItems = require('./lib/search_users_items')
const { filterPrivateAttributes } = require('controllers/items/lib/filter_private_attributes')
const { getGroupMembersIds } = require('controllers/groups/lib/groups')
const { getOwnerIdAndVisibilityKeys } = require('controllers/items/lib/get_authorized_items')
const filterVisibleDocs = require('lib/visibility/filter_visible_docs')
const shelves_ = require('controllers/shelves/lib/shelves')

const sanitization = {
  user: { optional: true },
  group: { optional: true },
  shelf: { optional: true },
  search: {}
}

const controller = async ({ reqUserId, userId, groupId, shelfId, search }) => {
  if (!(userId || groupId || shelfId)) {
    throw error_.newMissingQuery('user|group|shelf')
  }
  const usersIds = await getUsersIds({ userId, groupId, shelfId, reqUserId })
  if (usersIds.length === 0) return { items: [] }

  const ownersIdsAndVisibilityKeys = await Promise.all(usersIds.map(getOwnerIdAndVisibilityKeys(reqUserId)))
  const items = await searchUsersItems({ search, reqUserId, ownersIdsAndVisibilityKeys, shelfId })
  return {
    items: items.map(filterPrivateAttributes(reqUserId))
  }
}

const getUsersIds = async ({ userId, groupId, shelfId, reqUserId }) => {
  if (groupId) {
    return getGroupMembersIds(groupId)
  } else if (shelfId) {
    const shelf = await getAuthorizedShelf(shelfId, reqUserId)
    if (shelf) return [ shelf.owner ]
    else return []
  } else {
    return [ userId ]
  }
}

const getAuthorizedShelf = async (shelfId, reqUserId) => {
  const shelf = await shelves_.byId(shelfId)
  const res = await filterVisibleDocs([ shelf ], reqUserId)
  return res[0]
}

module.exports = { sanitization, controller }
