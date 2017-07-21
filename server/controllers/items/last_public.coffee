__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
items_ = __.require 'controllers', 'items/lib/items'
user_ = __.require 'controllers', 'user/lib/user'

module.exports = (req, res)->
  { query } = req
  { limit, offset } = query
  assertImage = query['assert-image'] is 'true'
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
  .then bundleOwnersData.bind(null, res, reqUserId)
  .catch error_.Handler(req, res)

bundleOwnersData = (res, reqUserId, items)->
  unless items?.length > 0
    throw error_.new 'no item found', 404

  users = getItemsOwners items
  user_.getUsersByIds reqUserId, users
  .then (users)-> res.json { items, users }

getItemsOwners = (items)->
  users = items.map (item)-> item.owner
  return _.uniq users
