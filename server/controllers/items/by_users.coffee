__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
{ validateQuery } = require './lib/queries_commons'
getItemsByUsers = require './lib/get_items_by_users'

module.exports = (req, res)->
  reqUserId = req.user?._id

  # Not including the associated users as this endpoint assumes
  # the requester already knows the users
  includeUsersDocs = false

  validateQuery req.query, 'users', _.isUserId
  .spread getItemsByUsers(reqUserId, includeUsersDocs)
  .then _.Wrap(res, 'items')
  .catch error_.Handler(req, res)
