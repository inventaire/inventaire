__ = require('config').universalPath
_ = __.require 'builders', 'utils'
getUsersNearby = __.require 'controllers', 'users/lib/get_users_nearby'
items_ = __.require 'controllers', 'items/lib/items'
getItemsByUsers = require './lib/get_items_by_users'
error_ = __.require 'lib', 'error/error'

module.exports = (req, res)->
  reqUserId = req.user?._id
  { range } = req.query

  includeUsersDocs = true

  getUsersNearby reqUserId, range
  .then getItemsByUsers(reqUserId, includeUsersDocs)
  .then res.json.bind(res)
  .catch error_.Handler(req, res)
