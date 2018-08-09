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
  'include-users':
    generic: 'boolean'
    default: true
  'strict-range':
    generic: 'boolean'
    default: false

module.exports = (req, res)->
  { _id:reqUserId } = req.user
  sanitize req, res, sanitization
  .then (params)->
    user_.nearby reqUserId, params.range, params.strictRange
    .then getItemsByUsers.bind(null, params)
  .then responses_.Send(res)
  .catch error_.Handler(req, res)
