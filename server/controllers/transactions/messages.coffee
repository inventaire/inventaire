__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
comments_ = __.require 'controllers', 'comments/lib/comments'
transactions_ = require './lib/transactions'
radio = __.require 'lib', 'radio'
{ Track } = __.require 'lib', 'track'

module.exports =
  get: (req, res, next)->
    { transaction } = req.query
    comments_.byTransactionId(transaction)
    .then res.json.bind(res)
    .catch error_.Handler(req, res)

  post: (req, res, next)->
    { transaction, message } = req.body
    reqUserId = req.user._id

    unless transaction?
      return error_.bundleMissingBody req, res, 'transaction'

    unless message?
      return error_.bundleMissingBody req, res, 'message'

    _.log [ transaction, message ], 'transaction, message'

    transactions_.byId transaction
    .then (transaction)->
      promises_.resolve transactions_.verifyRightToInteract(reqUserId, transaction)
      .get '_id'
      .then comments_.addTransactionComment.bind(null, reqUserId, message)
      .then (couchRes)->
        transactions_.updateReadForNewMessage reqUserId, transaction
        .then ->
          radio.emit 'transaction:message', transaction
          return couchRes
    .then res.json.bind(res)
    .then Track(req, ['transaction', 'message'])
    .catch error_.Handler(req, res)
