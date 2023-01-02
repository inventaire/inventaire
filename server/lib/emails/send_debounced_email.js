import transporter_ from './transporter.js'
import buildTransactionEmail from './build_transaction_email.js'
import { catchDisabledEmails } from './helpers.js'

export default {
  transactionUpdate: async transactionId => {
    let email
    try {
      email = await buildTransactionEmail(transactionId)
    } catch (err) {
      catchDisabledEmails(err)
    }

    if (!email) return

    return transporter_.sendMail(email)
  }
}
