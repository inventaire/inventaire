__ = require('config').universalPath
_ = __.require 'builders', 'utils'
getUsersNearby = __.require 'controllers', 'users/lib/get_users_nearby'
items_ = __.require 'controllers', 'items/lib/items'
getItemsByUsers = require './lib/get_items_by_users'
error_ = __.require 'lib', 'error/error'
{ validateLimitAndOffset } = require './lib/queries_commons'

module.exports = (req, res)->
  reqUserId = req.user?._id
  { query } = req
  { range } = query

  includeUsersDocs = true

  validateLimitAndOffset query
  .then (page)->
    getUsersNearby reqUserId, range
    .then getItemsByUsers.bind(null, reqUserId, includeUsersDocs, page)
  .then res.json.bind(res)
  .catch error_.Handler(req, res)
