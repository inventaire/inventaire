import { getGroupMembersIds } from '#controllers/groups/lib/groups'
import { filterPrivateAttributes } from '#controllers/items/lib/filter_private_attributes'
import { getOwnerIdAndVisibilityKeys } from '#controllers/items/lib/get_authorized_items'
import { getShelfById } from '#controllers/shelves/lib/shelves'
import { error_ } from '#lib/error/error'
import { filterVisibleDocs } from '#lib/visibility/filter_visible_docs'
import searchUsersItems from './lib/search_users_items.js'

const sanitization = {
  user: { optional: true },
  group: { optional: true },
  shelf: { optional: true },
  search: {},
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
    items: items.map(filterPrivateAttributes(reqUserId)),
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
  const shelf = await getShelfById(shelfId)
  const res = await filterVisibleDocs([ shelf ], reqUserId)
  return res[0]
}

export default { sanitization, controller }
