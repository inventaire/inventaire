__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
items_ = __.require 'controllers', 'items/lib/items'
sanitize = __.require 'lib', 'sanitize/sanitize'
bundleOwnersToItems = require './lib/bundle_owners_to_items'

sanitization =
  limit:
    default: 15
    max: 100
  offset:
    optional: true
  'assert-image':
    generic: 'boolean'
    default: false

module.exports = (req, res)->
  reqUserId = req.user?._id

  sanitize req, res, sanitization
  .then (params)->
    { limit, offset, assertImage } = params
    items_.publicByDate limit, offset, assertImage, reqUserId
  .then bundleOwnersToItems.bind(null, res, reqUserId)
  .catch error_.Handler(req, res)
