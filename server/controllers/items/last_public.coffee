__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
items_ = __.require 'controllers', 'items/lib/items'
user_ = __.require 'controllers', 'user/lib/user'

module.exports = (req, res) ->
  { query } = req
  { limit, offset } = query
  assertImage = query['assert-image'] is 'true'
  reqUserId = req.user?._id

  limit or= '15'
  offset or= '0'

  try
    limit = _.stringToInt limit
  catch err
    return error_.bundle req, res, 'invalid limit', 400, [limit, err]

  try
    offset = _.stringToInt offset
  catch err
    return error_.bundle req, res, 'invalid offset', 400, [offset, err]

  if limit > 100
    return error_.bundle req, res, "limit can't be over 100", 400, limit

  items_.publicByDate limit, offset, assertImage, reqUserId
  .then bundleOwnersData.bind(null, req, res)
  .catch error_.Handler(req, res)

bundleOwnersData = (req, res, items)->
  unless items?.length > 0
    return error_.bundle req, res, 'no item found', 404

  users = getItemsOwners items
  user_.getUsersPublicData users
  .then (users)-> res.json { items, users }

getItemsOwners = (items)->
  users = items.map (item)-> item.owner
  return _.uniq users
