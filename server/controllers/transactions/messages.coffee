__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
responses_ = __.require 'lib', 'responses'
promises_ = __.require 'lib', 'promises'
comments_ = __.require 'controllers', 'comments/lib/comments'
transactions_ = require './lib/transactions'
radio = __.require 'lib', 'radio'
{ Track } = __.require 'lib', 'track'

module.exports =
  get: (req, res, next)->
    { transaction } = req.query
    comments_.byTransactionId(transaction)
    .then responses_.Send(res)
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
      transactions_.verifyRightToInteract reqUserId, transaction
      { _id } = transaction
      comments_.addTransactionComment reqUserId, message, _id
      .then -> transactions_.updateReadForNewMessage reqUserId, transaction
      .then -> radio.emit 'transaction:message', transaction
    .then responses_.Ok(res)
    .then Track(req, [ 'transaction', 'message' ])
    .catch error_.Handler(req, res)
