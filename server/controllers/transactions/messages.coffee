__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
responses_ = __.require 'lib', 'responses'
promises_ = __.require 'lib', 'promises'
comments_ = __.require 'controllers', 'comments/lib/comments'
transactions_ = require './lib/transactions'
sanitize = __.require 'lib', 'sanitize/sanitize'
radio = __.require 'lib', 'radio'
{ Track } = __.require 'lib', 'track'

getSanitization =
  transaction: {}

postSanitization =
  transaction: {}
  message: {}

module.exports =
  get: (req, res, next)->
    sanitize req, res, getSanitization
    .then (params)-> comments_.byTransactionId params.transactionId
    .then responses_.Wrap(res, 'messages')
    .catch error_.Handler(req, res)

  post: (req, res, next)->
    sanitize req, res, postSanitization
    .then (params)->
      { transactionId, message, reqUserId } = params
      transactions_.byId transactionId
      .then (transaction)->
        transactions_.verifyRightToInteract reqUserId, transaction
        comments_.addTransactionComment reqUserId, message, transactionId
        .then -> transactions_.updateReadForNewMessage reqUserId, transaction
        .then -> radio.emit 'transaction:message', transaction
    .then responses_.Ok(res)
    .then Track(req, [ 'transaction', 'message' ])
    .catch error_.Handler(req, res)
