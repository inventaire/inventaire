import commonValidations from './common.js'

const { pass, userId, transactionId } = commonValidations

const commentValidations = {
  pass,
  userId,
  transactionId,
  message: message => message.length > 0 && message.length < 5000,
}

export default commentValidations
