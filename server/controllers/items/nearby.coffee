__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
user_ = __.require 'controllers', 'user/lib/user'
getItemsByUsers = require './lib/get_items_by_users'
sanitize = __.require 'lib', 'sanitize/sanitize'
responses_ = __.require 'lib', 'responses'
error_ = __.require 'lib', 'error/error'
{ validateLimitAndOffset } = require './lib/queries_commons'

sanitization =
  limit: {}
  offset: {}
  range: {}
  'strict-range':
    generic: 'boolean'
    default: false

includeUsersDocs = true

module.exports = (req, res)->
  { _id:reqUserId } = req.user
  sanitize req, res, sanitization
  .then (input)->
    user_.nearby reqUserId, input.range, input.strictRange
    .then getItemsByUsers.bind(null, reqUserId, includeUsersDocs, input)
  .then responses_.Send(res)
  .catch error_.Handler(req, res)
