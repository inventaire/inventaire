const _ = require('builders/utils')
const items_ = require('controllers/items/lib/items')
const getItemsByAccessLevel = require('controllers/items/lib/get_by_access_level')
const relations_ = require('controllers/relations/lib/queries')
const user_ = require('controllers/user/lib/user')
const { getLastItems, formatData, embedUsersData, getHighlightedItems } = require('./last_books_helpers')

module.exports = async (userId, lang, limitDate = 0) => {
  const networkUsersIds = await relations_.getUserFriendsAndCoGroupsMembers(userId)
  const networkItems = await getItemsByAccessLevel.network(networkUsersIds)
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
