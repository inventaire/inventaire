__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
sanitize = __.require 'lib', 'sanitize/sanitize'
responses_ = __.require 'lib', 'responses'
{ validFilters } = require './lib/queries_commons'
getItemsByUsers = require './lib/get_items_by_users'

sanitization =
  users: {}
  limit: { optional: true }
  offset: { optional: true }
  filter:
    whitelist: validFilters
    optional: true
  'include-users':
    generic: 'boolean'
    # Not including the associated users by default as this endpoint assumes
    # the requester already knows the users
    default: false

module.exports = (req, res)->
  sanitize req, res, sanitization
  .then getItemsByUsers
  .then responses_.Send(res)
  .catch error_.Handler(req, res)
