import { filterMaximumItemsPerOwner } from '#controllers/items/lib/filter_maximum_items_per_owner'
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
  items = filterMaximumItemsPerOwner(items, lang, limit)
  await removeUnauthorizedShelves(items, reqUserId)
  return bundleOwnersToItems(items, reqUserId)
}

export default { sanitization, controller }
