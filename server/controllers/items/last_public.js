const error_ = require('lib/error/error')
const items_ = require('controllers/items/lib/items')
const sanitize = require('lib/sanitize/sanitize')
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

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { limit, offset, assertImage, reqUserId } = params
    return items_.publicByDate(limit, offset, assertImage, reqUserId)
    .then(bundleOwnersToItems.bind(null, res, reqUserId))
  })
  .catch(error_.Handler(req, res))
}
