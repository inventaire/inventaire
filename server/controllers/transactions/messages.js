const __ = require('config').universalPath
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const comments_ = __.require('controllers', 'comments/lib/comments')
const transactions_ = require('./lib/transactions')
const sanitize = __.require('lib', 'sanitize/sanitize')
const radio = __.require('lib', 'radio')
const { Track } = __.require('lib', 'track')

const getSanitization =
  { transaction: {} }

const postSanitization = {
  transaction: {},
  message: {}
}

module.exports = {
  get: (req, res, next) => {
    return sanitize(req, res, getSanitization)
    .then(params => comments_.byTransactionId(params.transactionId))
    .then(responses_.Wrap(res, 'messages'))
    .catch(error_.Handler(req, res))
  },

  post: (req, res, next) => {
    return sanitize(req, res, postSanitization)
    .then(params => {
      const { transactionId, message, reqUserId } = params
      return transactions_.byId(transactionId)
      .then(transaction => {
        transactions_.verifyRightToInteract(reqUserId, transaction)
        return comments_.addTransactionComment(reqUserId, message, transactionId)
        .then(() => transactions_.updateReadForNewMessage(reqUserId, transaction))
        .then(() => radio.emit('transaction:message', transaction))
      })
    })
    .then(responses_.Ok(res))
    .then(Track(req, [ 'transaction', 'message' ]))
    .catch(error_.Handler(req, res))
  }
}
