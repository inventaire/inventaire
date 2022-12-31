import { pass, userId, transactionId } from './common'

export default {
  pass,
  userId,
  transactionId,
  message: message => message.length > 0 && message.length < 5000
}
