import commonValidations from './common.js'

const { pass, userId, transactionId } = commonValidations

export default {
  pass,
  userId,
  transactionId,
  message: message => message.length > 0 && message.length < 5000,
}
