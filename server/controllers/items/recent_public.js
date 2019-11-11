// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const items_ = __.require('controllers', 'items/lib/items')
const sanitize = __.require('lib', 'sanitize/sanitize')
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

module.exports = (req, res) => sanitize(req, res, sanitization)
.then((params) => {
  const { assertImage, lang, limit, reqUserId } = params
  return items_.publicByDate(itemsQueryLimit, offset, assertImage, reqUserId)
  .then(selectRecentItems(lang, limit))
  .then(bundleOwnersToItems.bind(null, res, reqUserId))}).catch(error_.Handler(req, res))

var selectRecentItems = (lang, limit) => (function(items) {
  const recentItems = []
  const discardedItems = []
  const itemsCountByOwner = {}

  for (const item of items) {
    if (recentItems.length === limit) { return recentItems }
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
  recentItems.push(...Array.from(itemsToFill || []))
  return recentItems
})
