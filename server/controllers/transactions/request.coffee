__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
items_ = __.require 'controllers', 'items/lib/items'
transactions_ = require './lib/transactions'
user_ = __.require 'controllers', 'user/lib/user'
{ Track } = __.require 'lib', 'track'

module.exports = (req, res, nex)->
  { item, message } = req.body
  reqUserId = req.user._id

  _.log [item, message], 'item request'

  unless item? then return error_.bundleMissingBody req, res, 'item'

  items_.byId item
  .then transactions_.verifyRightToRequest.bind(null, reqUserId)
  .then (itemDoc)->
    { owner:ownerId } = itemDoc
    user_.byIds [ownerId, reqUserId]
    .spread transactions_.create.bind(null, itemDoc)

  .get 'id'
  .then (id)->
    transactions_.addMessage(reqUserId, message, id)
    transactions_.byId(id)
    .then res.json.bind(res)
  .then Track(req, ['transaction', 'request'])
  .catch error_.Handler(req, res)
