import { getPublicItemsByDate } from '#controllers/items/lib/items'
import { removeUnauthorizedShelves } from '#controllers/items/lib/queries_commons'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import bundleOwnersToItems from './lib/bundle_owners_to_items.js'

const itemsQueryLimit = 100
const offset = 0

const sanitization = {
  'assert-image': {
    generic: 'boolean',
    default: false,
  },
  lang: {
    default: 'en',
  },
  limit: {
    default: 15,
  },
}

async function controller ({ assertImage, lang, limit, reqUserId }: SanitizedParameters) {
  let items = await getPublicItemsByDate(itemsQueryLimit, offset, assertImage, reqUserId)
  items = selectRecentItems(items, lang, limit)
  await removeUnauthorizedShelves(items, reqUserId)
  return bundleOwnersToItems(items, reqUserId)
}

function selectRecentItems (items, lang, limit) {
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
