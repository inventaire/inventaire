import { getGroupMembersIds } from '#controllers/groups/lib/groups'
import { filterPrivateAttributes } from '#controllers/items/lib/filter_private_attributes'
import { getOwnerIdAndVisibilityKeys } from '#controllers/items/lib/get_authorized_items'
import { getShelfById } from '#controllers/shelves/lib/shelves'
import { newMissingQueryError } from '#lib/error/pre_filled'
import { filterVisibleDocs } from '#lib/visibility/filter_visible_docs'
import type { GroupId } from '#types/group'
import type { ShelfId } from '#types/shelf'
import type { UserId } from '#types/user'
import { searchUsersItems } from './lib/search_users_items.js'

const sanitization = {
  user: { optional: true },
  group: { optional: true },
  shelf: { optional: true },
  search: {},
  limit: {},
  offset: {},
}

export interface ItemsSearchQuery {
  user?: GroupId
  group?: ShelfId
  shelf?: UserId
  search: string
  limit?: number
  offset?: number
}

const controller = async ({ reqUserId, userId, groupId, shelfId, search, limit, offset }) => {
  if (!(userId || groupId || shelfId)) {
    throw newMissingQueryError('user|group|shelf')
  }
  const usersIds = await getUsersIds({ userId, groupId, shelfId, reqUserId })
  if (usersIds.length === 0) return { items: [] }

  const ownersIdsAndVisibilityKeys = await Promise.all(usersIds.map(getOwnerIdAndVisibilityKeys(reqUserId)))
  const { hits: items, total, continue: continu } = await searchUsersItems({
    search,
    reqUserId,
    ownersIdsAndVisibilityKeys,
    shelfId,
    limit,
    offset,
  })
  return {
    items: items.map(filterPrivateAttributes(reqUserId)),
    total,
    continue: continu,
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
