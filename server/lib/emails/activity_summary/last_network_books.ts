import { map, uniq } from 'lodash-es'
import { getAuthorizedItemsByUsers } from '#controllers/items/lib/get_authorized_items'
import { serializeItemData } from '#controllers/items/lib/items'
import { getUserFriendsAndGroupsCoMembers } from '#controllers/relations/lib/lists'
import { getUsersByIds } from '#controllers/user/lib/user'
import type { Item, SerializedItem } from '#types/item'
import type { UserId } from '#types/user'
import { getLastItems, formatActivitySummaryItemsData, getActivitySummaryItemsViewModels, getHighlightedItems } from './last_books_helpers.js'
import type { WikimediaLanguageCode } from 'wikibase-sdk'

export async function getLastNetworkBooks (userId: UserId, lang: WikimediaLanguageCode, limitDate = 0) {
  const networkUsersIds = await getUserFriendsAndGroupsCoMembers(userId)
  const networkItems = await getAuthorizedItemsByUsers(networkUsersIds, userId)
  const lastNetworkItems = getLastItems(limitDate, networkItems)
  const selectionData = await extractHighlightedItems(lastNetworkItems, lang)
  return selectionData
}

async function extractHighlightedItems (lastItems: Item[], lang: WikimediaLanguageCode) {
  const highlightedItems: SerializedItem[] = await Promise.all(getHighlightedItems(lastItems, 10).map(serializeItemData))
  const users = await getItemsUsers(highlightedItems)
  const activitySummaryItemsViewModels = getActivitySummaryItemsViewModels(highlightedItems, users)
  return formatActivitySummaryItemsData(activitySummaryItemsViewModels, 'network', lang, lastItems.length)
}

async function getItemsUsers (items: Item[]) {
  const usersIds: UserId[] = uniq(map(items, 'owner'))
  return getUsersByIds(usersIds)
}
