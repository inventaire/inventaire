import { map, uniq } from 'lodash-es'
import { getGroupMembersIds } from '#controllers/groups/lib/groups'
import { dbFactory } from '#db/couchdb/base'
import { combinations, uniqByKey } from '#lib/utils/base'
import { getAllowedVisibilityKeys } from '#lib/visibility/allowed_visibility_keys'
import { getGroupVisibilityKey } from '#lib/visibility/visibility'
import type { Item } from '#types/item'
import type { UserId } from '#types/user'

const db = await dbFactory('items')

export const getOwnerIdAndVisibilityKeys = reqUserId => async ownerId => {
  const visibilityKeys = await getAllowedVisibilityKeys(ownerId, reqUserId)
  return [ ownerId, visibilityKeys ]
}

interface getAuthorizedItemsByUsersOptions {
  withoutShelf?: boolean
}

// Return what the reqUserId user is allowed to see
export async function getAuthorizedItemsByUsers (usersIds: UserId[], reqUserId: UserId, options: getAuthorizedItemsByUsersOptions = {}) {
  const ownersIdsAndVisibilityKeysCombinations = await getUsersAllowedVisibilityKeys(usersIds, reqUserId)
  const view = options.withoutShelf ? 'byOwnerAndVisibilityKeyWithoutShelf' : 'byOwnerAndVisibilityKey'
  return getItemsFromViewAndAllowedVisibilityKeys(view, ownersIdsAndVisibilityKeysCombinations)
}

export async function getAuthorizedItemsByGroup (groupId, reqUserId) {
  const allGroupMembersIds = await getGroupMembersIds(groupId)
  const allowedVisibilityKeys = [ 'public' ]
  if (reqUserId && allGroupMembersIds.includes(reqUserId)) {
    allowedVisibilityKeys.push('groups', getGroupVisibilityKey(groupId))
  }
  return getUsersItems({
    usersIds: allGroupMembersIds,
    allowedVisibilityKeys,
  })
}

export async function getAuthorizedItemsByShelves (shelves, reqUserId) {
  const keys = await getShelvesAllowedVisibilityKeys(shelves, reqUserId)
  return getItemsFromViewAndAllowedVisibilityKeys('byShelfAndVisibilityKey', keys)
}

async function getUsersAllowedVisibilityKeys (usersIds, reqUserId) {
  const ownersIdsAndVisibilityKeys = await Promise.all(usersIds.map(getOwnerIdAndVisibilityKeys(reqUserId)))
  return ownersIdsAndVisibilityKeys.flatMap(([ ownerId, allowedVisibilityKeys ]) => {
    return combinations([ ownerId ], allowedVisibilityKeys)
  })
}

async function getShelvesAllowedVisibilityKeys (shelves, reqUserId) {
  const ownersIds = uniq(map(shelves, 'owner'))
  const ownersIdsAndVisibilityKeys = await Promise.all(ownersIds.map(getOwnerIdAndVisibilityKeys(reqUserId)))
  const allowedVisibilityKeysByOwner = Object.fromEntries(ownersIdsAndVisibilityKeys)
  return shelves.flatMap(shelf => {
    const allowedVisibilityKeys = allowedVisibilityKeysByOwner[shelf.owner]
    return combinations([ shelf._id ], allowedVisibilityKeys)
  })
}

async function getUsersItems ({ usersIds, allowedVisibilityKeys, withoutShelf = false }) {
  const view = withoutShelf ? 'byOwnerAndVisibilityKeyWithoutShelf' : 'byOwnerAndVisibilityKey'
  const keys = combinations(usersIds, allowedVisibilityKeys)
  return getItemsFromViewAndAllowedVisibilityKeys(view, keys)
}

// The function below could be implementated another way:
// - do not include_docs in the first request
// - deduplicate ids
// - fetch deduplicate docs by ids
async function getItemsFromViewAndAllowedVisibilityKeys (view, keys) {
  const items = await db.getDocsByViewKeys<Item>(view, keys)
  // Items with several visibility keys might be returned several times,
  // thus the need to deduplicate items
  return uniqByKey<Item>(items, '_id')
}
