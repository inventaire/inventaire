import _ from 'builders/utils'
import items_ from 'controllers/items/lib/items'
import relations_ from 'controllers/relations/lib/queries'
import user_ from 'controllers/user/lib/user'
import { getLastItems, formatData, embedUsersData, getHighlightedItems } from './last_books_helpers'
import getAuthorizedItems from 'controllers/items/lib/get_authorized_items'

export default async (userId, lang, limitDate = 0) => {
  const networkUsersIds = await relations_.getUserFriendsAndCoGroupsMembers(userId)
  const networkItems = await getAuthorizedItems.byUsers(networkUsersIds)
  const lastNetworkItems = getLastItems(limitDate, networkItems)
  const selectionData = await extractHighlightedItems(lastNetworkItems, lang)
  // Serializing items last, as fetching items snapshots data can be expensive,
  // so better do it on the smallest set possible
  selectionData.highlighted = await Promise.all(selectionData.highlighted.map(items_.serializeData))
  return selectionData
}

const extractHighlightedItems = async (lastItems, lang) => {
  let highlightedItems = getHighlightedItems(lastItems, 10)
  highlightedItems = await attachUsersData(highlightedItems)
  return formatData(lastItems, 'network', lang, highlightedItems)
}

const attachUsersData = async items => {
  const usersIds = _.uniq(items.map(_.property('owner')))
  const users = await user_.byIds(usersIds)
  return embedUsersData(items, users)
}
