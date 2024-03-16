import { map, uniq } from 'lodash-es'
import { getAuthorizedItemsByUsers } from '#controllers/items/lib/get_authorized_items'
import { serializeItemData } from '#controllers/items/lib/items'
import { getUserFriendsAndGroupsCoMembers } from '#controllers/relations/lib/lists'
import { getUsersByIds } from '#controllers/user/lib/user'
import type { UserId } from '#types/user'
import { getLastItems, formatData, getActivitySummaryItemsViewModels, getHighlightedItems } from './last_books_helpers.js'

export async function getLastNetworkBooks (userId, lang, limitDate = 0) {
  const networkUsersIds = await getUserFriendsAndGroupsCoMembers(userId)
  const networkItems = await getAuthorizedItemsByUsers(networkUsersIds, userId)
  const lastNetworkItems = getLastItems(limitDate, networkItems)
  const selectionData = await extractHighlightedItems(lastNetworkItems, lang)
  // Serializing items last, as fetching items snapshots data can be expensive,
  // so better do it on the smallest set possible
  selectionData.highlighted = await Promise.all(selectionData.highlighted.map(serializeItemData))
  return selectionData
}

const extractHighlightedItems = async (lastItems, lang) => {
  let highlightedItems = getHighlightedItems(lastItems, 10)
  highlightedItems = await attachUsersData(highlightedItems)
  return formatData(lastItems, 'network', lang, highlightedItems)
}

const attachUsersData = async items => {
  const usersIds: UserId[] = uniq(map(items, 'owner'))
  const users = await getUsersByIds(usersIds)
  return getActivitySummaryItemsViewModels(items, users)
}
