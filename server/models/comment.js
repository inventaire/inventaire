const validations = require('./validations/comment')

module.exports = {
  createTransactionComment: (userId, message, transactionId) => {
    validations.pass('transactionId', transactionId)
    return createComment(userId, message, 'transaction', transactionId)
  },

  validations
}

const createComment = (userId, message, key, value) => {
  validations.pass('userId', userId)
  validations.pass('message', message)

  const comment = {
    user: userId,
    message,
    created: Date.now()
  }

  // the key identifies the object to which the comment is attached
  comment[key] = value

  return comment
}
