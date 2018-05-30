__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
sanitize = __.require 'lib', 'sanitize/sanitize'
getItemsByUsers = require './lib/get_items_by_users'

module.exports = (req, res)->
  reqUserId = req.user?._id

  # Not including the associated users as this endpoint assumes
  # the requester already knows the users
  includeUsersDocs = false

  sanitize req, res, { ids: {} }
  .then getItemsByUsers.bind(null, reqUserId, includeUsersDocs)
  .then res.json.bind(res)
  .catch error_.Handler(req, res)
