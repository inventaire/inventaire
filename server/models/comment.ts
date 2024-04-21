import commenntValidations from './validations/comment.js'

export function createTransactionComment (userId, message, transactionId) {
  commenntValidations.pass('transactionId', transactionId)
  return createComment(userId, message, 'transaction', transactionId)
}

function createComment (userId, message, key, value) {
  commenntValidations.pass('userId', userId)
  commenntValidations.pass('message', message)

  const comment = {
    user: userId,
    message,
    created: Date.now(),
  }

  // the key identifies the object to which the comment is attached
  comment[key] = value

  return comment
}
