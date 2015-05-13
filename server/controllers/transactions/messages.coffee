__ = require('config').root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
comments_ = __.require 'controllers', 'comments/lib/comments'
transactions_ = require './lib/transactions'

module.exports =
  get: (req, res, next)->
    { transaction } = req.query
    comments_.byTransactionId(transaction)
    .then res.json.bind(res)
    .catch error_.Handler(res)

  post: (req, res, next)->
    { transaction, message } = req.body
    userId = req.user._id

    unless transaction?
      return error_.bundle res, 'missing transaction id', 400
    unless message?
      return error_.bundle res, 'missing message', 400

    _.log [transaction, message], 'transaction, message'

    transactions_.byId transaction
    .then transactions_.verifyRightToInteract.bind(null, userId)
    .then comments_.addTransactionComment.bind(null, userId, message)
    .then res.json.bind(res)
    .catch error_.Handler(res)
