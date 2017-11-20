__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
items_ = __.require 'controllers', 'items/lib/items'
bundleOwnersToItems = require './lib/bundle_owners_to_items'

module.exports = (req, res)->
  { query } = req
  { limit, offset } = query
  assertImage = _.parseBooleanString query['assert-image']
  reqUserId = req.user?._id

  limit or= '15'
  offset or= '0'

  try
    limit = _.stringToInt limit
  catch err
    return error_.bundleInvalid req, res, 'limit', limit

  try
    offset = _.stringToInt offset
  catch err
    return error_.bundleInvalid req, res, 'offset', offset

  if limit > 100
    return error_.bundle req, res, "limit can't be over 100", 400, limit

  items_.publicByDate limit, offset, assertImage, reqUserId
  .then bundleOwnersToItems.bind(null, res, reqUserId)
  .catch error_.Handler(req, res)
