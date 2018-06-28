__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
responses_ = __.require 'lib', 'responses'
items_ = __.require 'controllers', 'items/lib/items'
transactions_ = require './lib/transactions'
user_ = __.require 'controllers', 'user/lib/user'
sanitize = __.require 'lib', 'sanitize/sanitize'
{ Track } = __.require 'lib', 'track'

sanitization =
  item: {}
  message: {}

module.exports = (req, res, nex)->
  sanitize req, res, sanitization
  .then (params)->
    { item, message, reqUserId } = params

    _.log [ item, message ], 'item request'

    items_.byId item
    .then transactions_.verifyRightToRequest.bind(null, reqUserId)
    .then (itemDoc)->
      { owner:ownerId } = itemDoc
      user_.byIds [ ownerId, reqUserId ]
      .spread transactions_.create.bind(null, itemDoc)
    .get 'id'
    .then (id)->
      transactions_.addMessage reqUserId, message, id
      .then -> transactions_.byId id
    .then responses_.Wrap(res, 'transaction')
  .then Track(req, [ 'transaction', 'request' ])
  .catch error_.Handler(req, res)
