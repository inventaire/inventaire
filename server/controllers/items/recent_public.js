import items_ from 'controllers/items/lib/items'
import bundleOwnersToItems from './lib/bundle_owners_to_items'
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

const controller = async ({ assertImage, lang, limit, reqUserId }) => {
  let items = await items_.publicByDate(itemsQueryLimit, offset, assertImage, reqUserId)
  items = selectRecentItems(items, lang, limit)
  return bundleOwnersToItems(items, reqUserId)
}

const selectRecentItems = (items, lang, limit) => {
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

export default { sanitization, controller }
