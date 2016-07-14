__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
comments_ = __.require 'controllers', 'comments/lib/comments'
transactions_ = require './lib/transactions'
Radio = __.require 'lib', 'radio'
{ Track } = __.require 'lib', 'track'

module.exports =
  get: (req, res, next)->
    { transaction } = req.query
    comments_.byTransactionId(transaction)
    .then res.json.bind(res)
    .catch error_.Handler(req, res)

  post: (req, res, next)->
    { transaction, message } = req.body
    userId = req.user._id

    unless transaction?
      return error_.bundle req, res, 'missing transaction id', 400
    unless message?
      return error_.bundle req, res, 'missing message', 400

    _.log [transaction, message], 'transaction, message'

    transactions_.byId transaction
    .then (transaction)->
      promises_.resolve transactions_.verifyRightToInteract(userId, transaction)
      .get '_id'
      .then comments_.addTransactionComment.bind(null, userId, message)
      .then (couchRes)->
        transactions_.updateReadForNewMessage userId, transaction
        .then ->
          Radio.emit 'transaction:message', transaction
          return couchRes
    .then res.json.bind(res)
    .then Track(req, ['transaction', 'message'])
    .catch error_.Handler(req, res)
