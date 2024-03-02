import { property, uniq } from 'lodash-es'
import { getAuthorizedItemsByUsers } from '#controllers/items/lib/get_authorized_items'
import { serializeItemData } from '#controllers/items/lib/items'
import { getUserFriendsAndGroupsCoMembers } from '#controllers/relations/lib/lists'
import { getUsersByIds } from '#controllers/user/lib/user'
import { getLastItems, formatData, embedUsersData, getHighlightedItems } from './last_books_helpers.js'

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
  const usersIds = uniq(items.map(property('owner')))
  const users = await getUsersByIds(usersIds)
  return embedUsersData(items, users)
}
