const user_ = require('controllers/user/lib/user')
const items_ = require('controllers/items/lib/items')
const getAuthorizedItems = require('controllers/items/lib/get_authorized_items')
const { getLastItems, formatData, embedUsersData, getHighlightedItems } = require('./last_books_helpers')
const range = 20
const strictRange = true

module.exports = async (user, limitDate = 0) => {
  const { _id: reqUserId, position, lang } = user

  if (position == null) return formatData([], 'nearby', lang, [])

  const usersIds = await user_.nearby(reqUserId, range, strictRange)
  const [ items, users ] = await Promise.all([
    getAuthorizedItems.byUsers(usersIds, reqUserId),
    user_.getUsersByIds(usersIds, reqUserId),
  ])

  return formatItems({ items, users, limitDate, position, lang })
}

const formatItems = ({ items, users, limitDate, position, lang }) => {
  items = items.map(items_.serializeData)
  let lastItems = getLastItems(limitDate, items)
  const highlighted = getHighlightedItems(lastItems, 10)
  lastItems = embedUsersData(lastItems, users, position)
  return formatData(lastItems, 'nearby', lang, highlighted)
}
