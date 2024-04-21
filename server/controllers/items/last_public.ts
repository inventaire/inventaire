import { getPublicItemsByDate } from '#controllers/items/lib/items'
import bundleOwnersToItems from './lib/bundle_owners_to_items.js'

const sanitization = {
  limit: {
    default: 15,
    max: 100,
  },
  offset: {
    optional: true,
  },
  'assert-image': {
    generic: 'boolean',
    default: false,
  },
}

async function controller ({ limit, offset, assertImage, reqUserId }) {
  const items = await getPublicItemsByDate(limit, offset, assertImage, reqUserId)
  return bundleOwnersToItems(items, reqUserId)
}

export default { sanitization, controller }
