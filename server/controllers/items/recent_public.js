const __ = require('config').universalPath
const error_ = require('lib/error/error')
const items_ = require('controllers/items/lib/items')
const sanitize = require('lib/sanitize/sanitize')
const bundleOwnersToItems = require('./lib/bundle_owners_to_items')
const itemsQueryLimit = 100
const offset = 0

const sanitization = {
  'assert-image': {
    generic: 'boolean',
    default: false
  },
  lang: {
    default: 'en'
  },
  limit: {
    default: 15
  }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { assertImage, lang, limit, reqUserId } = params
    return items_.publicByDate(itemsQueryLimit, offset, assertImage, reqUserId)
    .then(selectRecentItems(lang, limit))
    .then(bundleOwnersToItems.bind(null, res, reqUserId))
  })
  .catch(error_.Handler(req, res))
}

const selectRecentItems = (lang, limit) => items => {
  const recentItems = []
  const discardedItems = []
  const itemsCountByOwner = {}

  for (const item of items) {
    if (recentItems.length === limit) return recentItems
    if (itemsCountByOwner[item.owner] == null) { itemsCountByOwner[item.owner] = 0 }
    if ((item.snapshot['entity:lang'] === lang) && (itemsCountByOwner[item.owner] < 3)) {
      itemsCountByOwner[item.owner]++
      recentItems.push(item)
    } else {
      discardedItems.push(item)
    }
  }

  const missingItemsCount = limit - recentItems.length
  const itemsToFill = discardedItems.slice(0, missingItemsCount)
  recentItems.push(...itemsToFill)
  return recentItems
}
