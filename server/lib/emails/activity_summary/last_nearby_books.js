const CONFIG = require('config')
const __ = CONFIG.universalPath
const items_ = require('controllers/items/lib/items')
const { getLastItems, formatData, embedUsersData, getHighlightedItems } = require('./last_books_helpers')

module.exports = (user, limitDate = 0) => {
  const { _id: userId, position, lang } = user

  if (position == null) return formatData([], 'nearby', lang, [])

  return items_.nearby(userId, 20, true)
  .then(formatItems(limitDate, position, lang))
}

const formatItems = (limitDate, position, lang) => ([ users, items ]) => {
  items = items.map(items_.serializeData)
  let lastItems = getLastItems(limitDate, items)
  const highlighted = getHighlightedItems(lastItems, 10)
  lastItems = embedUsersData(lastItems, users, position)
  return formatData(lastItems, 'nearby', lang, highlighted)
}
