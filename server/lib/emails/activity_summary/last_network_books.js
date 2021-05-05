const _ = require('builders/utils')
const items_ = require('controllers/items/lib/items')
const getItemsByAccessLevel = require('controllers/items/lib/get_by_access_level')
const relations_ = require('controllers/relations/lib/queries')
const user_ = require('controllers/user/lib/user')
const { getLastItems, formatData, embedUsersData, getHighlightedItems } = require('./last_books_helpers')

module.exports = async (userId, lang, limitDate = 0) => {
  const networkUsersIds = await relations_.getUserFriendsAndCoGroupsMembers(userId)
  const networkItems = await getItemsByAccessLevel.network(networkUsersIds)
  const serializedNetworkItems = await Promise.all(networkItems.map(items_.serializeData))
  const lastNetworkItems = getLastItems(limitDate, serializedNetworkItems)
  return extractHighlightedItems(lastNetworkItems, lang)
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
