const items_ = require('controllers/items/lib/items')
const bundleOwnersToItems = require('./lib/bundle_owners_to_items')

const sanitization = {
  limit: {
    default: 15,
    max: 100
  },
  offset: {
    optional: true
  },
  'assert-image': {
    generic: 'boolean',
    default: false
  }
}

const controller = async ({ limit, offset, assertImage, reqUserId }) => {
  const items = await items_.publicByDate(limit, offset, assertImage, reqUserId)
  return bundleOwnersToItems(items, reqUserId)
}

module.exports = { sanitization, controller }
